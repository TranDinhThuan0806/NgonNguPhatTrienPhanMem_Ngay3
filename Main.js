// --- KHỞI TẠO ---
const API_URL = 'https://api.escuelajs.co/api/v1/products';
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 5;

// --- 1. GET ALL ---
async function getAll() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Lỗi API");
        
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        
        console.log(`Đã tải ${allProducts.length} sản phẩm.`);
        renderTable();
    } catch (error) {
        console.error(error);
        document.getElementById('tableBody').innerHTML = 
            `<tr><td colspan="5" style="text-align:center; color:red; background:white;">Lỗi tải dữ liệu!</td></tr>`;
    }
}

// --- HÀM LÀM SẠCH LINK ẢNH ---
// Hàm này giúp xử lý chuỗi JSON lỗi thường gặp của API này
function parseImageString(rawUrl) {
    if (!rawUrl) return "";
    let url = rawUrl;
    
    // Nếu link bị bọc trong chuỗi JSON, ví dụ '["http..."]'
    if (typeof url === 'string' && (url.startsWith('[') || url.includes('"'))) {
        try {
            const parsed = JSON.parse(url);
            url = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch (e) {
            // Fallback: regex xóa ký tự lạ
            url = url.replace(/[\[\]"]/g, '');
        }
    }
    // Xóa ngoặc kép đầu cuối nếu còn
    if (typeof url === 'string') url = url.replace(/^"|"$/g, '');
    
    return url.startsWith('http') ? url : "";
}

// --- 2. RENDER TABLE (LOGIC MỚI) ---
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = ''; 

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayData = filteredProducts.slice(startIndex, endIndex);

    if (displayData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; background:white; color:black;">Không tìm thấy dữ liệu</td></tr>`;
        updatePaginationInfo();
        return;
    }

    displayData.forEach(item => {
        // --- LOGIC XỬ LÝ ẢNH MỚI ---
        
        // 1. Ảnh Đại Diện (Lớn): Lấy từ Category
        let mainImgUrl = "https://placehold.co/140x140?text=No+Cover";
        if (item.category && item.category.image) {
            const cleanCatImg = parseImageString(item.category.image);
            if(cleanCatImg) mainImgUrl = cleanCatImg;
        }

        // 2. Ảnh Chi Tiết (Nhỏ): Lấy từ mảng Product Images
        let detailImages = [];
        if (Array.isArray(item.images)) {
             // Làm sạch từng link trong mảng
             detailImages = item.images.map(img => parseImageString(img)).filter(img => img !== "");
        }

        // Tạo HTML cho các ảnh chi tiết
        // Thêm sự kiện onclick: Khi bấm vào ảnh nhỏ, đổi ảnh lớn thành ảnh đó
        const galleryHTML = detailImages.map(url => 
            `<img src="${url}" 
                  class="detail-img" 
                  onclick="this.closest('.image-container').querySelector('.category-img').src='${url}'"
                  onerror="this.style.display='none'">` 
        ).join('');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>
                <div class="image-container">
                    <img src="${mainImgUrl}" 
                         class="category-img" 
                         alt="Main Cover"
                         onerror="this.src='https://placehold.co/140x140?text=Err'">
                    
                    <div class="gallery-row">
                        ${galleryHTML}
                    </div>
                </div>
            </td>
            <td>${item.title}</td>
            <td>$${item.price}</td>
            <td>${item.description ? item.description.substring(0, 60) + '...' : ''}</td>
        `;
        tbody.appendChild(tr);
    });

    updatePaginationInfo();
}

// --- 3. CÁC HÀM XỬ LÝ KHÁC (GIỮ NGUYÊN) ---
function handleSearch() {
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    filteredProducts = allProducts.filter(p => p.title.toLowerCase().includes(keyword));
    currentPage = 1;
    renderTable();
}

function handleSort(criteria, order) {
    filteredProducts.sort((a, b) => {
        let valA = a[criteria];
        let valB = b[criteria];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });
    renderTable();
}

function handlePageSize() {
    itemsPerPage = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    renderTable();
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
    }
}

function updatePaginationInfo() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const displayPage = totalPages === 0 ? 0 : currentPage;
    document.getElementById('page-info').innerText = `Trang ${displayPage} / ${totalPages}`;
}

// Chạy
getAll();