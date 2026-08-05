// public/script.js
document.addEventListener("DOMContentLoaded", function () {
  const chatHistory = document.getElementById("chatHistory");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");

  // 用于保存对话历史，每次发送时会将整个历史传给后端
  let conversationHistory = [
    {
      role: "assistant",
      content: "你好！我是你的AI助手。我已经准备就绪，可以开始聊天了！",
    },
  ];

  // 发送消息函数
  async function sendMessage() {
    const userInput = document.getElementById("userInput");
    const userText = userInput.value.trim();
    if (!userText) return;

    // 1. 清空输入框并禁用
    userInput.value = "";
    userInput.disabled = true;
    sendButton.disabled = true;

    // 2. 添加用户消息到界面
    appendMessage("user", userText);

    // 3. 添加一个空的机器人消息气泡作为“打字机”的载体
    const thinkingMsgElement = appendMessage("bot", ""); // 内容为空
    const thinkingBubble = thinkingMsgElement.querySelector(".bubble");
    let fullReply = ""; // 用于累积完整的回复

    try {
      // 4. 发起流式请求
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userText }], // 注意：当前是单轮
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("网络响应异常");
      }

      // 5. 设置流式读取器
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      // 6. 循环读取数据流
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // 流读取自然结束时跳出

        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            // 🔴 修改点1：正确处理 [DONE] 信号
            if (dataStr.trim() === "[DONE]") {
              // 当收到结束信号时，立即移除光标样式
              thinkingBubble.classList.remove("typing");
              break; // 可以跳出内层循环
            }

            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                fullReply += data.chunk;
                typeWriterEffect(thinkingBubble, fullReply);
              }
            } catch (e) {
              /* 忽略解析错误 */
            }
          }
        }
      }

      // 🔴 修改点2：循环结束后，确保光标被移除（安全保证）
      thinkingBubble.classList.remove("typing");

      // 7. 流读取完成后，确保最终文本完整显示
      thinkingBubble.textContent = fullReply;
    } catch (error) {
      console.error("发送消息失败:", error);
      thinkingBubble.textContent = `抱歉，出错了: ${error.message}`;
      thinkingBubble.style.color = "#d32f2f";
    } finally {
      // 8. 重新启用输入
      userInput.disabled = false;
      sendButton.disabled = false;
      userInput.focus();
    }
  }

  // 🔴 新增：打字机效果核心函数
  function typeWriterEffect(element, fullText) {
    // 每次调用都从第一字开始，重新“打”到当前累积的文本末尾
    // 这保证了即使网络块来得快，也能看到逐字效果
    element.textContent = fullText;
    // 可选：添加光标闪烁效果
    element.classList.add("typing");
    // 如果后续不再打字，可以移除光标 class
    // setTimeout(() => element.classList.remove('typing'), 500);
  }

  // 向聊天历史区域添加一条消息的函数
  function appendMessage(sender, text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const avatarDiv = document.createElement("div");
    avatarDiv.className = "avatar";
    avatarDiv.innerHTML =
      sender === "user"
        ? '<i class="fas fa-user"></i>'
        : '<i class="fas fa-robot"></i>';

    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "bubble";
    bubbleDiv.innerHTML = formatMessage(text);

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(bubbleDiv);
    chatHistory.appendChild(messageDiv);

    // 滚动到最底部
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // 返回消息元素，方便后续更新（如“思考中...”消息）
    return messageDiv;
  }

  // 简单格式化消息内容（将换行转换为<br>，识别代码块）
  function formatMessage(text) {
    if (!text) return "";
    // 1. 将文本中的换行符转换为HTML换行
    let html = text.replace(/\n/g, "<br>");
    // 2. 简单识别 ```代码块``` 格式（非常基础的实现）
    html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
    // 3. 识别行内代码 `code`
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    return html;
  }

  // 事件监听
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // 防止在输入框中换行
      sendMessage();
    }
  });

  // 页面加载后自动聚焦到输入框
  userInput.focus();
});
