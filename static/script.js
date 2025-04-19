$(document).ready(function() {
    // Chatbot Message Submission Logic
    $("#messageArea").on("submit", function(event) {
        event.preventDefault();

        const date = new Date();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const str_time = hour + ":" + minute;

        var rawText = $("#text").val();
        if (rawText.trim() === "") return;

        var userHtml = `
            <div class="d-flex justify-content-end mb-4">
                <div class="msg_cotainer_send">
                    ${rawText}
                    <span class="msg_time_send">${str_time}</span>
                </div>
                <div class="img_cont_msg">
                    <img "{{ url_for('static', filename='https://cdn.vectorstock.com/i/1000v/82/55/anonymous-user-circle-icon-vector-18958255.jpg') }}" class="rounded-circle user_img_msg">
                </div>
            </div>`;

        $("#text").val("");
        $("#messageFormeight").append(userHtml);

        $.ajax({
            data: { msg: rawText },
            type: "POST",

            url: "/get", // Ensure this endpoint exists on your server
        }).done(function(data) {
            const botMessage = { sender: 'bot', text: data };
            const botHtml = createChatContainer([botMessage], renderMessageContent).innerHTML;
            // Using $.parseHTML ensures script injection is less likely if data contains HTML
            $("#messageFormeight").append($.parseHTML(botHtml));
            // Optional: Scroll to the bottom of the chat
            $("#messageFormeight").scrollTop($("#messageFormeight")[0].scrollHeight);
        });
    });

    // Speech Recognition Logic
    const micButton = document.getElementById("micButton");
    const textInput = document.getElementById("text");
    const languageSelect = document.getElementById("languageSelect"); // Get the select element
    let recognition;
    let isListening = false;

    // Check if Speech Recognition API is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error("Speech Recognition API not supported in this browser.");
        micButton.disabled = true; // Disable mic button if not supported
        micButton.innerHTML = '<i class="fas fa-microphone-slash"></i>'; // Indicate it's disabled
    } else {
        micButton.addEventListener("click", function() {
            if (!isListening) {
                // --- Get the selected language ---
                const selectedLang = languageSelect.value; // Get value from the dropdown
                //----------------------------------

                recognition = new SpeechRecognition();
                // --- Set the selected language ---
                recognition.lang = selectedLang;
                //----------------------------------
                recognition.interimResults = true; // Get results as user speaks
                recognition.continuous = false; // Set to false: stop when user stops speaking for a moment

                recognition.start();
                isListening = true;
                micButton.innerHTML = '<i class="fas fa-microphone-slash text-danger"></i>'; // Indicate listening (e.g., red slash)

                let final_transcript = ''; // Store final transcript segments

                recognition.onresult = function(event) {
                    let interim_transcript = '';
                    final_transcript = ''; // Reset final transcript on new result stream

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final_transcript += event.results[i][0].transcript;
                        } else {
                            interim_transcript += event.results[i][0].transcript;
                        }
                    }
                     // Show interim results in the input field while speaking
                    textInput.value = final_transcript + interim_transcript;
                };

                 recognition.onspeechend = function() {
                    // Automatically stop recognition when speech ends
                    // Note: recognition.stop() might be implicitly called by the browser,
                    // but calling it ensures the 'onend' event fires consistently.
                    // If using continuous=true, you might not want this here.
                     if (recognition) {
                        recognition.stop();
                    }
                };


                recognition.onerror = function(event) {
                    console.error("Speech recognition error:", event.error);
                    isListening = false;
                    micButton.innerHTML = '<i class="fas fa-microphone"></i>';
                };

                recognition.onend = function() {
                     // Update input field with the final transcript ONLY when recognition ends
                    if (final_transcript) {
                      textInput.value = final_transcript.trim();
                    }
                    isListening = false;
                    micButton.innerHTML = '<i class="fas fa-microphone"></i>';
                    recognition = null; // Clean up recognition object
                };
            } else {
                // If already listening, stop it
                if (recognition) {
                    recognition.stop();
                }
                isListening = false; // State will be fully reset in onend
                micButton.innerHTML = '<i class="fas fa-microphone"></i>'; // Change icon immediately
            }
        });
    } // End of SpeechRecognition check

    // Chat container creation function
    function createChatContainer(messages, renderMessageContent) {
        const chatContainer = document.createElement('div');
        // Removed unnecessary classes here as appending individual message wrappers

        messages.forEach((msg, index) => {
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'} mb-4`;

            const messageContent = document.createElement('div');
            // Added 'p-2' for some padding inside the message bubble
            messageContent.className = `msg_cotainer${msg.sender === 'user' ? '_send' : ''} p-2`;
            messageContent.innerHTML = renderMessageContent(msg.text); // Use innerHTML safely

            const imgCont = document.createElement('div');
            imgCont.className = 'img_cont_msg';
            const img = document.createElement('img');
            // Use relative paths or template variables for images if possible
            img.src = msg.sender === 'user' ? '/Users/parasthakur/Downloads/Agribot/image/user.png' : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSr-yZg3wf8BBWzHfKl3PbBT9Ub8-jMfgSepw&s';
            img.alt = msg.sender === 'user' ? 'User' : 'Bot'; // Add alt text for accessibility
            img.className = 'rounded-circle user_img_msg';
            imgCont.appendChild(img);

            // Create timestamp element dynamically for bot messages too
            const date = new Date();
            const hour = date.getHours();
            const minute = date.getMinutes().toString().padStart(2, '0'); // Pad minutes with zero
            const str_time = hour + ":" + minute;
            const timeSpan = document.createElement('span');
            timeSpan.className = msg.sender === 'user' ? 'msg_time_send' : 'msg_time';
            timeSpan.textContent = str_time;


            if (msg.sender === 'user') {
                messageWrapper.appendChild(messageContent);
                // Append timestamp inside message container for user
                messageContent.appendChild(timeSpan);
                messageWrapper.appendChild(imgCont);
            } else {
                messageWrapper.appendChild(imgCont);
                messageWrapper.appendChild(messageContent);
                // Append timestamp inside message container for bot
                 messageContent.appendChild(timeSpan);
            }

            chatContainer.appendChild(messageWrapper);
        });

        return chatContainer; // Returns a container with just the new messages
    }

    // Function to render message content with basic formatting (bold)
    function renderMessageContent(text) {
        // Escape HTML to prevent XSS before applying formatting
        const escapedText = $('<div>').text(text).html();
        // Replace **text** with <b>text</b> for bold formatting
        // Corrected regex: Look for exactly two asterisks on each side
        const formattedText = escapedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        // Replace *text* with <i>text</i> for italic formatting
        const finalText = formattedText.replace(/\*(.*?)\*/g, '<i>$1</i>');
        // No need to wrap in <p> here if msg_cotainer handles block display
        return finalText;
    }

    // Optional: Auto-scroll to bottom when new messages are added
    // Select the node that will be observed for mutations
    const targetNode = document.getElementById('messageFormeight');
    // Options for the observer (which mutations to observe)
    const config = { childList: true };
    // Callback function to execute when mutations are observed
    const callback = function(mutationsList, observer) {
        for(const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                // Scroll to the bottom smoothly
                targetNode.scrollTo({ top: targetNode.scrollHeight, behavior: 'smooth' });
            }
        }
    };
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    // Start observing the target node for configured mutations
    if(targetNode) {
      observer.observe(targetNode, config);
    }

});