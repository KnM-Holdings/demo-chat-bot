import { Client } from "@langchain/langgraph-sdk";

// Configuration
const API_URL = import.meta.env.VITE_LANGGRAPH_API_URL;
// const API_KEY = 'sk-proj-1234567890';

// Create client instance
let clientInstance = null;

/**
 * Initialize LangGraph client
 * @returns {Client} LangGraph client instance
 */
export const getClient = () => {
  if (!clientInstance) {
    clientInstance = new Client({
      apiUrl: API_URL,
      callerOptions: {
        maxRetries: 0, // Tắt retry để tránh gọi nhiều lần
      },
    });
  }
  return clientInstance;
};

/**
 * Generate a unique thread ID
 * @returns {string} Thread ID
 */
export const generateThreadId = () => {
  // generate random UUID
  return crypto.randomUUID();
};

/**
 * Create a new thread
 * @param {string} threadId - Thread ID (UUID)
 * @returns {Promise<Object>} Created thread
 */
export const createThread = async (threadId) => {
  const client = getClient();
  // Ensure threadId is a string (UUID format)
  return await client.threads.create({ threadId: String(threadId) });
};

/**
 * Get thread by ID
 * @param {string} threadId - Thread ID (UUID)
 * @returns {Promise<Object>} Thread object
 */
export const getThread = async (threadId) => {
  const client = getClient();
  // Ensure threadId is a string (UUID format)
  return client.threads.get(threadId);
};

/**
 * Get or create thread
 * @param {string} threadId - Thread ID (UUID)
 * @returns {Promise<{threadId: string, threadStatus: string | null}>} Thread info
 */
export const getOrCreateThread = async (threadId) => {
  // Ensure threadId is a string (UUID format)
  const threadIdString = String(threadId);
  try {
    const thread = await getThread(threadIdString);
    console.log(`[LangGraph] Reusing thread: ${threadIdString}`);
    return {
      threadId: thread.thread_id,
      threadStatus: thread.status || null,
    };
  } catch (error) {
    // If thread doesn't exist, create it
    console.warn("Thread not found, creating new one:", error);
    try {
      const thread = await createThread(threadIdString);
      console.log(`[LangGraph] Created new thread: ${threadIdString}`, thread);
      return {
        threadId: thread.thread_id,
        threadStatus: thread.status || null,
      };
    } catch (createError) {
      throw new Error("Không thể tạo thread.");
    }
  }
};

// get assistantId
let assistantIdCache = null;
export async function getAssistantId() {
  if (assistantIdCache) {
    return assistantIdCache;
  }

  // Search for assistant if no config
  const client = getClient();
  const assistants = await client.assistants.search();
  const assistant = assistants[0];
  const assistantId = assistant?.assistant_id || assistant?.assistantId;

  if (!assistantId) {
    throw new Error("No assistant found");
  }

  assistantIdCache = assistantId;
  console.log(`[LangGraph] Using assistant: ${assistantId}`);
  return assistantId;
}

/**
 * Stream messages from LangGraph
 * @param {Object} options - Stream options
 * @param {string} options.threadId - Thread ID (UUID)
 * @param {Object} options.input - Input messages
 * @param {boolean} options.isInterrupted - Whether thread is interrupted
 * @param {string} options.resumeContent - Content to resume with (if interrupted)
 * @param {Function} options.onMessage - Callback for each message chunk
 * @param {Object} options.flagRef - Reference to flag for worker messages
 * @returns {Promise<void>}
 */
export const streamMessages = async ({
  threadId,
  input,
  isInterrupted = false,
  resumeContent = null,
  onMessage,
  flagRef,
}) => {
  const client = getClient();
  // Ensure threadId is a string (UUID format)
  const threadIdString = String(threadId);

  const assistantId = await getAssistantId();

  if (isInterrupted && resumeContent) {
    // Resume interrupted thread
    // API: client.runs.stream(threadId, assistantId, payload)
    const stream = client.runs.stream(threadIdString, assistantId, {
      input: null,
      multitaskStrategy: "interrupt",
      streamMode: "messages-tuple",
      command: { resume: resumeContent },
    });

    for await (const chunk of stream) {
      if (chunk.event !== "messages") continue;
      const [messageChunk, metadata] = chunk.data;
      if (messageChunk.type === "tool") continue;
      if (metadata.langgraph_node === "agent") {
        if (messageChunk.content && onMessage) {
          onMessage(messageChunk.content);
        }
      }
    }
  } else {
    // New message stream
    // API: client.runs.stream(threadId, assistantId, payload)
    const stream = client.runs.stream(threadIdString, assistantId, {
      input: input,
      multitaskStrategy: "interrupt",
      streamMode: "messages-tuple",
    });

    for await (const chunk of stream) {
      if (chunk.event !== "messages") continue;

      const [messageChunk, metadata] = chunk.data;

      if (messageChunk.type === "tool") continue;

      // Handle worker flag
      if (messageChunk.additional_kwargs?.parsed?.worker) {
        if (flagRef) {
          flagRef.current = !flagRef.current;
        }
      }

      // Check finish reason
      if (
        messageChunk.response_metadata?.finish_reason === "stop" &&
        flagRef?.current
      ) {
        break;
      }

      if (flagRef?.current) {
        if (messageChunk.content && onMessage) {
          onMessage(messageChunk.content);
        }
      }
    }
  }
};

/**
 * Process a chat message
 * @param {Object} options - Process options
 * @param {string} options.threadId - Thread ID (UUID)
 * @param {Object} options.inputHuman - Input messages
 * @param {Function} options.onMessage - Callback for each message chunk
 * @param {Object} options.flagRef - Reference to flag for worker messages
 * @returns {Promise<void>}
 */
export const processMessage = async ({
  threadId,
  inputHuman,
  onMessage,
  flagRef,
}) => {
  // Ensure threadId is a string (UUID format)
  const threadIdString = String(threadId);

  // Get or create thread - returns {threadId, threadStatus}
  const { threadId: actualThreadId, threadStatus } = await getOrCreateThread(
    threadIdString
  );
  const isNewThread = threadStatus !== "interrupted";

  console.log("threadStatus", threadStatus);

  if (flagRef) {
    flagRef.current = false;
  }

  // Stream messages
  await streamMessages({
    threadId: actualThreadId,
    input: inputHuman,
    isInterrupted: !isNewThread,
    resumeContent: !isNewThread ? inputHuman.messages[0].content : null,
    onMessage,
    flagRef,
  });
};
