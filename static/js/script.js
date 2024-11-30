  //Login Funcitionlaity
  
   document.addEventListener("DOMContentLoaded", () => {
       const loginForm = document.getElementById("loginForm");
       const registerForm = document.getElementById("registerForm");

       const showForm = "{{ show_form }}";
       if (showForm === "register") {
           loginForm.style.display = "none";
           registerForm.style.display = "block";
       } else {
           loginForm.style.display = "block";
           registerForm.style.display = "none";
       }
   });

   function toggleForm(formId) {
       const loginForm = document.getElementById("loginForm");
       const registerForm = document.getElementById("registerForm");

       if (formId === "loginForm") {
           loginForm.style.display = "block";
           registerForm.style.display = "none";
       } else {
           loginForm.style.display = "none";
           registerForm.style.display = "block";
       }
   }
   


// Show view logic


function showView(viewId) {
    const views = document.querySelectorAll('.view'); // Select all elements with the class 'view'
    views.forEach((view) => {
        view.classList.remove('active'); // Remove 'active' class from all views
        view.style.display = 'none'; // Hide all views
    });
    const targetView = document.getElementById(viewId); // Find the target view
    if (targetView) {
        targetView.classList.add('active'); // Add 'active' class to the target view
        targetView.style.display = viewId === 'home-view' ? 'flex' : 'block'; // Flex for home, block for others
    }
}



// DOMContentLoaded initialization


document.addEventListener('DOMContentLoaded', () => {
    // Export all tables button
    const exportAllBtn = document.getElementById('ExportBtn');
    if (exportAllBtn) {
        exportAllBtn.addEventListener('click', exportAllTablesToExcel);
    }


    // Export single inventory 
    
    
    const exportInventoryBtn = document.getElementById('ExportTableInventory');
    if (exportInventoryBtn) {
        exportInventoryBtn.addEventListener('click', () => exportTableToExcel('inventoryTable', 'Inventory.xlsx'));
    }


    // Toggle Add Item form 
    
    
    const toggleButton = document.getElementById('toggle-add-item-btn');
    const addItemForm = document.getElementById('addItemForm');
    if (toggleButton && addItemForm) {
        toggleButton.addEventListener('click', () => {
            addItemForm.classList.toggle('hidden');
            toggleButton.textContent = addItemForm.classList.contains('hidden') ? 'Show Add Item Form' : 'Hide Add Item Form';
        });
    }



    // Add item form submission 
    
    
    const addItemFormElem = document.getElementById('addItemForm');
    if (addItemFormElem) {
        addItemFormElem.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);

            try {
                const response = await fetch('/add_inventory', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server error:', errorText);
                    alert('Failed to add item. Check console for details.');
                    return;
                }

                const result = await response.json();
                const tableBody = document.getElementById('inventoryTableBody');
                const newRow = document.createElement('tr');
                newRow.dataset.id = result.id;
                newRow.innerHTML = `
                    <td>${result.id}</td>
                    <td>${result.product_name}</td>
                    <td>${result.quantity}</td>
                    <td>${result.price}</td>
                    <td>${result.expiration_date || 'N/A'}</td>
                    <td><button onclick="deleteItem(${result.id})">Delete</button></td>
                `;
                tableBody.appendChild(newRow);
                alert('Item added successfully.');
                event.target.reset();
                await refreshInventoryTable();
            } catch (error) {
                console.error('Error adding item:', error);
                alert('An error occurred while adding the item.');
            }
        });
    }
});


// Refresh inventory table


async function refreshInventoryTable() {
    try {
        const response = await fetch('/dashboard', { method: 'GET' });
        if (response.ok) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(await response.text(), 'text/html');
            const updatedTableBody = doc.querySelector('#inventoryTableBody');
            const tableBody = document.getElementById('inventoryTableBody');
            if (updatedTableBody && tableBody) {
                tableBody.innerHTML = updatedTableBody.innerHTML;
            }
        } else {
            console.error('Failed to refresh inventory table.');
        }
    } catch (error) {
        console.error('Error refreshing table:', error);
    }
}


// Attach event listeners to delete buttons
document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-btn')) {
        const itemId = event.target.dataset.id;

        if (confirm('Are you sure you want to delete this item?')) {
            try {
                const response = await fetch(`/delete_item/${itemId}`, { method: 'POST' });
                if (response.ok) {
                    const row = document.querySelector(`tr[data-id='${itemId}']`);
                    if (row) row.remove();
                    alert('Item deleted successfully.');
                } else {
                    alert(`Failed to delete item. Status: ${response.status}`);
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert('Failed to delete item. Please try again.');
            }
        }
    }
});



// Export all tables



// Export all tables to Excel
function exportAllTablesToExcel() {
    const tables = document.querySelectorAll('table');
    const workbook = XLSX.utils.book_new();

    tables.forEach((table, index) => {
        const filteredData = extractTableData(table, ['ID', 'Product Name', 'Quantity', 'Price', 'Expiration Date']);
        const worksheet = XLSX.utils.aoa_to_sheet(filteredData);

        // Add a watermark
        addWatermark(worksheet, filteredData);

        // Adjust column widths
        autoAdjustColumnWidths(worksheet, filteredData);

        const sheetName = `Sheet${index + 1}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    XLSX.writeFile(workbook, 'AllTablesWithWatermark.xlsx');
}

// Function to extract table data
function extractTableData(table, allowedHeaders) {
    const rows = Array.from(table.rows);
    const data = [];

    // Extract headers
    const headers = Array.from(rows[0].cells)
        .map((cell) => cell.textContent.trim())
        .filter((header) => allowedHeaders.includes(header));

    data.push(headers); // Add headers to the data

    // Extract row data
    rows.slice(1).forEach((row) => {
        const rowData = [];
        Array.from(row.cells).forEach((cell, index) => {
            const header = rows[0].cells[index]?.textContent.trim();
            if (allowedHeaders.includes(header)) {
                const value = cell.textContent.trim();
                rowData.push(header === 'Expiration Date' ? formatDate(value) : value);
            }
        });
        if (rowData.length > 0) {
            data.push(rowData);
        }
    });

    return data;
}

// Format date values
function formatDate(dateString) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toISOString().split('T')[0]; // Format as yyyy-mm-dd
}

// Add a watermark at the bottom
function addWatermark(worksheet, data) {
    const rowCount = data.length;
    const columnCount = data[0].length;

    // Add watermark text in the next row
    const watermarkRow = rowCount + 2; // Leave a gap
    const watermarkText = 'NARD Inventory Systems';

    // Place the watermark text in the first cell
    const cellAddress = XLSX.utils.encode_cell({ r: watermarkRow, c: 0 });
    worksheet[cellAddress] = { v: watermarkText, t: 's' };

    // Merge the watermark across all columns
    worksheet['!merges'] = worksheet['!merges'] || [];
    worksheet['!merges'].push({
        s: { r: watermarkRow, c: 0 },
        e: { r: watermarkRow, c: columnCount - 1 },
    });
}

// Auto-adjust column widths
function autoAdjustColumnWidths(worksheet, data) {
    worksheet['!cols'] = data[0].map((_, colIndex) => ({
        wch: Math.max(
            ...data.map((row) => (row[colIndex] ? row[colIndex].toString().length : 10)), // Calculate max width
            10 // Minimum width
        ),
    }));
}

// Export a single table to Excel
function exportTableToExcel(tableId, fileName) {
    const table = document.getElementById(tableId);
    if (table) {
        const filteredData = extractTableData(table, ['ID', 'Product Name', 'Quantity', 'Price', 'Expiration Date']);
        const worksheet = XLSX.utils.aoa_to_sheet(filteredData);

        // Add a watermark
        addWatermark(worksheet, filteredData);

        // Adjust column widths
        autoAdjustColumnWidths(worksheet, filteredData);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, fileName);
    } else {
        alert('Table not found!');
    }
}



//Update Button Function



document.getElementById("updateItemForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const itemId = formData.get("item_id");

    try {
        const response = await fetch(`/update_inventory/${itemId}`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error(await response.text());
        const result = await response.json();
        alert("Item updated successfully!");
        console.log(result);
        // Optionally, refresh the page or update the table dynamically
    } catch (error) {
        console.error("Error updating item:", error);
        alert("Failed to update item.");
    }
});
function openUpdateModal(itemId, productName, quantity, price, expirationDate) {
    const updateModal = document.getElementById("updateItemModal");
    const updateForm = document.getElementById("updateItemForm");

    // Populate form fields with current item data
    updateForm.querySelector("input[name='item_id']").value = itemId;
    updateForm.querySelector("input[name='product_name']").value = productName;
    updateForm.querySelector("input[name='quantity']").value = quantity;
    updateForm.querySelector("input[name='price']").value = price;
    updateForm.querySelector("input[name='expiration_date']").value = expirationDate || "";

    // Show the modal
    updateModal.style.display = "block";
}
function closeUpdateModal() {
    const updateModal = document.getElementById("updateItemModal");
    updateModal.style.display = "none";
}

document.getElementById("updateItemForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const itemId = formData.get("item_id");

    try {
        const response = await fetch(`/update_inventory/${itemId}`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error(await response.text());
        const result = await response.json();
        alert("Item updated successfully!");

        // Close the modal
        closeUpdateModal();

        // Refresh the inventory table
        await refreshInventoryTable();
    } catch (error) {
        console.error("Error updating item:", error);
        alert("Failed to update item.");
    }
});
