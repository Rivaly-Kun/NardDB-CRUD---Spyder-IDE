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
   
function showView(viewId) {
    const views = document.querySelectorAll('.view'); // Select all elements with the class 'view'
    views.forEach((view) => {
        view.classList.remove('active'); // Remove 'active' class from all views
        view.style.display = 'none'; // Hide all views
    });
    const targetView = document.getElementById(viewId); // Find the target view
    if (targetView) {
        targetView.classList.add('active'); // Add 'active' class to the target view
        if (viewId === 'home-view') {
            targetView.style.display = 'flex'; // Display the home-view as flex
        } else {
            targetView.style.display = 'block'; // Display other views as block
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Export all tables button
    const exportAllBtn = document.getElementById('ExportBtn');
    exportAllBtn.addEventListener('click', function () {
        exportAllTablesToExcel();
    });

    // Export single inventory table
    const exportInventoryBtn = document.getElementById('ExportTableInventory');
    exportInventoryBtn.addEventListener('click', function () {
        exportTableToExcel('inventoryTable', 'Inventory.xlsx');
    });
});

// Export all tables to a single Excel file
function exportAllTablesToExcel() {
    const tables = document.querySelectorAll('table');
    const workbook = XLSX.utils.book_new();

    tables.forEach((table, index) => {
        const tableName = `Sheet${index + 1}`;
        const worksheet = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
    });

    XLSX.writeFile(workbook, 'AllTables.xlsx');
}

// Export a single table to an Excel file
function exportTableToExcel(tableId, fileName) {
    const table = document.getElementById(tableId);
    if (table) {
        const worksheet = XLSX.utils.table_to_sheet(table);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, fileName);
    } else {
        alert('Table not found!');
    }
}



      // Define the function
    function toggleAddItemForm() {
        const form = document.getElementById("add-item-form");
        if (form.style.display === "none" || form.style.display === "") {
            form.style.display = "block";
        } else {
            form.style.display = "none";
        }
    }
  const toggleButton = document.getElementById("toggle-add-item-btn");
    const addItemForm = document.getElementById("addItemForm");


  
    toggleButton.addEventListener("click", function () {
        addItemForm.classList.toggle("hidden");
        if (addItemForm.classList.contains("hidden")) {
            toggleButton.textContent = "Show Add Item Form";
        } else {
            toggleButton.textContent = "Hide Add Item Form";
        }
    });


document.addEventListener("DOMContentLoaded", () => {
    // Add item form submission handling
    document.getElementById("addItemForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        try {
            const response = await fetch("/add_inventory", {
                method: "POST",
                body: formData,
            });

            if (response.status === 401) {
                alert("Unauthorized. Please log in again.");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server error:", errorText);
                alert("Failed to add item. Check console for details.");
                return;
            }

            const result = await response.json();

            // Add the new item to the table
            const tableBody = document.getElementById("inventoryTableBody");
            const newRow = document.createElement("tr");
            newRow.dataset.id = result.id;
            newRow.innerHTML = `
                <td>${result.id}</td>
                <td>${result.product_name}</td>
                <td>${result.quantity}</td>
                <td>${result.price}</td>
                <td>${result.expiration_date || "N/A"}</td>
                <td>
                    <button onclick="deleteItem(${result.id})">Delete</button>
                </td>
            `;
            tableBody.appendChild(newRow);

            // Reset the form and show a success message
            event.target.reset();
            alert("Item added successfully.");

            // Optional: Refresh the table if needed
            await refreshInventoryTable();
        } catch (error) {
         alert("Item added successfully.");
            await refreshInventoryTable();
              addItemForm.classList.add("hidden");
            toggleButton.textContent = "Show Add Item Form";
        }
    });

    // Function to refresh the inventory table
    async function refreshInventoryTable() {
        try {
            const response = await fetch("/dashboard", { method: "GET" });
            if (response.ok) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(await response.text(), "text/html");
                const updatedTableBody = doc.querySelector("#inventoryTableBody");
                const tableBody = document.getElementById("inventoryTableBody");

                // Replace the old table body with the updated one
                tableBody.innerHTML = updatedTableBody.innerHTML;
            } else {
                console.error("Failed to refresh inventory table.");
            }
        } catch (error) {
            console.error("Error refreshing table:", error);
        }
    }

    // Function to delete item
    window.deleteItem = async function (itemId) {
        try {
            const response = await fetch(`/delete_item/${itemId}`, {
                method: "POST",
            });

            if (response.ok) {
                const row = document.querySelector(`tr[data-id='${itemId}']`);
                if (row) row.remove();
                alert("Item deleted successfully.");
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete item. Please try again.");
        }
    };
});

