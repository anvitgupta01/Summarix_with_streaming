//Navigation Bar
const barsIcon = document.querySelector(".fa-bars");
const timesIcon = document.querySelector(".fa-times");
const navLinks = document.querySelector(".navLinks");

barsIcon.addEventListener("click", function () {
    navLinks.classList.add("show");
    barsIcon.style.display = "none";
    timesIcon.style.display = "block";
});

timesIcon.addEventListener("click", function () {
    navLinks.classList.remove("show");
    timesIcon.style.display = "none";
    barsIcon.style.display = "block";
});

//File Upload
const fileInput = document.getElementById("documentUpload");
const customUploadButton = document.getElementById("customUploadButton");
const fileName = document.getElementById("fileName");

fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
        fileName.textContent = " " + fileInput.files[0].name;
    }
});

customUploadButton.addEventListener("click", function () {
    fileInput.click();
});

//Word Count
textArea = document.getElementById('textArea');
const wordCount1 = document.getElementById('wordCount1');
const currWords = document.getElementById('currWords');

function checkWordCount() {
    if (textArea) {
        const text = textArea.value;
        const words = text.split(/\s+/).filter(word => word.length > 0);
        wordCount1.textContent = words.length + "/10000 words";

        if (words.length > 10000) {
            wordCount1.textContent = words.length + "/10000 words !!";
            wordCount1.classList.add("red");
        }

        else {
            wordCount1.textContent = words.length + "/10000 words";
            wordCount1.classList.remove("red");
        }

        currWords.value = words.length;
    }
}

checkWordCount();
textArea.addEventListener('input', function () {
    checkWordCount();
});

wordCount2 = document.getElementById('wordCount2');
const outputText = document.getElementsByClassName("outputBox")[0].textContent;
const words = outputText.split(/\s+/).filter(word => word.length > 0);
wordCount2.textContent = words.length + "/10000 words";

//Clipboard Copy
const btn = document.getElementById("copyToClipboard");
btn.addEventListener("click", () => {
    const cb = navigator.clipboard;
    cb.writeText(outputText);
});

//Checkboxes for paragraph and key points
function decideModesOptions(s1, s2, s3, s4) {
    var x = document.getElementById(s1);
    var y = document.getElementById(s2);
    var z = document.getElementById(s3);
    function toggleButtons(id) {
        if (id == s1) {
            x.classList.add(s4);
            y.classList.remove(s4);
            z.value = s1;
        }

        if (id == s2) {
            x.classList.remove(s4);
            y.classList.add(s4);
            z.value = s2;
        }
        console.log(z);
    }

    x.addEventListener("click", function () { toggleButtons(x.id); });
    y.addEventListener("click", function () { toggleButtons(y.id); });
}

decideModesOptions("paragraph", "keyPoints", "mode", "checked");
decideModesOptions("extractive", "abstractive", "option", "checked");

// submit button
btn_submit = document.getElementById("submit")

btn_submit.addEventListener("click", async () => {
    const wordCount2 = document.getElementById('wordCount2'); 
    const inputText = document.getElementById('textArea').value;
    const outputBox = document.getElementById("output");
    const type_sum_block = document.getElementsByClassName("type_sum")
    const kp_block = document.getElementsByClassName("kp")
    const size_block = document.getElementsByClassName("size")
    
    type_sum = ""
    size = ""
    kp = ""
    
    if (type_sum_block[0].classList.contains("checked")) {
        type_sum = "extractive"
    } else {
        type_sum = "abstractive"
    }

    if (kp_block[0].classList.contains("checked")) {
        kp = "paragraph"
    } else {
        kp = "keypoints"
    }

    if (size_block[0].checked) {
        size = "small"
    } else if (size_block[1].checked) {
        size = "medium"
    } else {
        size = "large"
    }

    const formData = new FormData();
    const fileInput = document.getElementById("documentUpload");

    if (!kp || !type_sum || (!inputText && !fileInput.files.length)) {
        return;
    }
    
    if (fileInput.files.length) {
        formData.append("file", fileInput.files[0]);
    }

    formData.append("inputText", inputText);
    formData.append("type_sum", type_sum);
    formData.append("kp", kp);
    formData.append("size", size);

    const response = await fetch("/summarize", {
        method: "POST",
        enctype:"multipart/form-data",
        body: formData,
    });
    
    const reader = response.body.getReader();
    outputBox.innerText = ""
    wordCount2.textContent = 0 + "/10000 words"

    while(true) {
        const {done,value} = await reader.read();
        chunk = new TextDecoder().decode(value);
        outputBox.innerText += chunk
        const outputText = document.getElementsByClassName("outputBox")[0].textContent;
        const words = outputText.split(/\s+/).filter(word => word.length > 0);
        wordCount2.textContent = words.length + "/10000 words";
        if (done) {
            return;
        }
    }
})