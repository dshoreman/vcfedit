const templates = {
    vCardColumn: document.querySelector('#vcard-column'),
}

const addCardColumn = () => {
    const clone = templates.vCardColumn.content.cloneNode(true),
        container = document.querySelector('#vcards');

    // Fall back to 0 or it'll be NaN for the first column.
    let columns = parseInt(container.style.columnCount) || 0;

    container.style.columnCount = 1 + parseInt(columns);
    container.append(clone);
};

const openFile = function(event) {
    const file = event.target.files[0],
        reader = new FileReader();

    reader.onload = () => {
        const column = event.target.parentNode;

        column.querySelector('h2').innerText = file.name;
        column.querySelector('pre').innerText = reader.result;
    };

    reader.readAsText(file);
}

document.getElementById('extracard').onclick = addCardColumn;
