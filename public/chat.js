window.onload = function(){

    var socket = io.connect('ws://localhost:3000');
    socket.on("connect", function () {
        
    });


    var idForm = document.getElementById("idFrom");
    var textForm = document.getElementById("form");

    idForm.onsubmit = function () {
        var idInput = document.getElementById("idInput");
        // idForm.style.display = 'none';
        // textForm.style.display = 'block';
        socket.emit('sign_in', '123456', idInput.value);
    };

    textForm.onsubmit = function(){
        var idInput = document.getElementById("idInput");
        var textInput = document.getElementById("input");
        var toUserIdInput = document.getElementById('toUserId');
        var message = {
            fromId : idInput.value,
            type : 'friend',
            toUserId : toUserIdInput.value,
            content : textInput.value
        }
        socket.emit('message', message);
    };

}