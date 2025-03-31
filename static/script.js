$(document).ready(function() {
    $("#messageArea").on("submit", function(event) {
        event.preventDefault(); // Prevent default form submission

        const date = new Date();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const str_time = hour + ":" + minute;

        var rawText = $("#text").val();
        if (rawText.trim() === "") return; // Ignore empty messages

        var userHtml = `
            <div class="d-flex justify-content-end mb-4">
                <div class="msg_cotainer_send">
                    ${rawText}
                    <span class="msg_time_send">${str_time}</span>
                </div>
                <div class="img_cont_msg">
                    <img src="https://i.ibb.co/d5b84Xw/Untitled-design.png" class="rounded-circle user_img_msg">
                </div>
            </div>`;

        $("#text").val("");
        $("#messageFormeight").append(userHtml);

        $.ajax({
            data: { msg: rawText },
            type: "POST",
            url: "/get",
        }).done(function(data) {
            var botHtml = `
                <div class="d-flex justify-content-start mb-4">
                    <div class="img_cont_msg">
                        <img src="https://cdn-icons-png.flaticon.com/512/387/387569.png" class="rounded-circle user_img_msg">
                    </div>
                    <div class="msg_cotainer">
                        ${data}
                        <span class="msg_time">${str_time}</span>
                    </div>
                </div>`;
            $("#messageFormeight").append($.parseHTML(botHtml));
        });
    });

    // Speech-to-Text Functionality
    const micButton = document.getElementById("micButton");
    const textInput = document.getElementById("text");

    micButton.addEventListener("click", function() {
        let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.start();

        recognition.onstart = function() {
            micButton.innerHTML = '<i class="fas fa-microphone-slash"></i>'; // Change icon when listening
        };

        recognition.onspeechend = function() {
            recognition.stop();
            micButton.innerHTML = '<i class="fas fa-microphone"></i>'; // Reset icon after speech
        };

        recognition.onresult = function(event) {
            let transcript = event.results[0][0].transcript;
            textInput.value = transcript; // Set text input value
        };
    });
});
