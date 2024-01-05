const openFile = function(event) {
    const reader = new FileReader();

    reader.onload = function() {
        const vcardContents = reader.result;

        document.getElementById('vcard').innerText = vcardContents;
    }

    reader.readAsText(event.target.files[0]);
}
