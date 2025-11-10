// ===== GLOBAL VARIABLES =====
let bookings = [];
let services = {};
let gallery = [];
let settings = {};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Alra Care Admin Panel initialized');
    
    // Load data from localStorage
    loadData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup form submissions
    setupForms();
    
    // Display initial data
    displayDashboardData();
    displayAllBookings();
    displayServiceCategories();
    displayServiceOptions();
    displayGallery();
});

// ===== DATA MANAGEMENT =====
function loadData() {
    // Load bookings
    try {
        bookings = JSON.parse(localStorage.getItem('klinikBookings') || '[]');
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookings = [];
    }
    
    // Load services
    try {
        services = JSON.parse(localStorage.getItem('serviceDetails') || '{}');
    } catch (error) {
        console.error('Error loading services:', error);
        services = {};
    }
    
    // Load gallery
    try {
        gallery = JSON.parse(localStorage.getItem('klinikGallery') || '[]');
    } catch (error) {
        console.error('Error loading gallery:', error);
        gallery = [];
    }
    
    // Load settings
    try {
        settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    } catch (error) {
        console.error('Error loading settings:', error);
        settings = {};
    }
}

function saveData() {
    localStorage.setItem('klinikBookings', JSON.stringify(bookings));
    localStorage.setItem('serviceDetails', JSON.stringify(services));
    localStorage.setItem('klinikGallery', JSON.stringify(gallery));
    localStorage.setItem('adminSettings', JSON.stringify(settings));
}

// ===== NAVIGATION =====
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show selected page
            const pageId = this.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');
        });
    });
}

// ===== DASHBOARD FUNCTIONS =====
function displayDashboardData() {
    // Calculate dashboard statistics
    const totalBookings = bookings.length;
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(booking => 
        booking.appointmentInfo.date === today
    ).length;
    
    // Calculate monthly revenue (simplified)
    const monthlyRevenue = bookings.reduce((total, booking) => {
        // Extract price from service options (simplified calculation)
        let price = 0;
        if (booking.serviceInfo && booking.serviceInfo.selectedOptions) {
            booking.serviceInfo.selectedOptions.forEach(option => {
                const priceMatch = option.price.match(/(\d+\.?\d*)/g);
                if (priceMatch) {
                    price += parseInt(priceMatch[0].replace(/\./g, ''));
                }
            });
        }
        return total + price;
    }, 0);
    
    // Count available services
    let serviceCount = 0;
    Object.keys(services).forEach(category => {
        serviceCount += services[category].options.length;
    });
    
    // Update dashboard cards
    document.getElementById('totalBookings').textContent = totalBookings;
    document.getElementById('todayBookings').textContent = todayBookings;
    document.getElementById('monthlyRevenue').textContent = 'Rp ' + monthlyRevenue.toLocaleString('id-ID');
    document.getElementById('availableServices').textContent = serviceCount;
    
    // Display recent bookings
    displayRecentBookings();
}

function displayRecentBookings() {
    const tableBody = document.getElementById('recentBookingsTable');
    const recentBookings = bookings.slice(-5).reverse(); // Get last 5 bookings
    
    if (recentBookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-calendar-times" style="font-size: 2rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                    <p>Tidak ada booking terbaru</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = recentBookings.map(booking => {
        const appointmentDate = new Date(booking.appointmentInfo.datetime);
        const formattedDate = appointmentDate.toLocaleDateString('id-ID');
        
        return `
            <tr>
                <td>${booking.bookingId}</td>
                <td>${booking.patientInfo.name}</td>
                <td>${booking.serviceInfo.serviceName}</td>
                <td>${formattedDate}</td>
                <td><span class="status status-${booking.status}">${getStatusText(booking.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="viewBooking('${booking.bookingId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="updateBookingStatus('${booking.bookingId}', 'confirmed')">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== BOOKING MANAGEMENT =====
function displayAllBookings() {
    const tableBody = document.getElementById('allBookingsTable');
    
    if (bookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-calendar-times" style="font-size: 2rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                    <p>Tidak ada booking</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort bookings by date (newest first)
    const sortedBookings = [...bookings].sort((a, b) => 
        new Date(b.bookingDate) - new Date(a.bookingDate)
    );
    
    tableBody.innerHTML = sortedBookings.map(booking => {
        const appointmentDate = new Date(booking.appointmentInfo.datetime);
        const formattedDate = appointmentDate.toLocaleDateString('id-ID');
        const formattedTime = booking.appointmentInfo.time;
        
        return `
            <tr>
                <td>${booking.bookingId}</td>
                <td>${booking.patientInfo.name}</td>
                <td>${booking.patientInfo.phone}</td>
                <td>${booking.serviceInfo.serviceName}</td>
                <td>${formattedDate} ${formattedTime}</td>
                <td><span class="status status-${booking.status}">${getStatusText(booking.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="viewBooking('${booking.bookingId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="updateBookingStatus('${booking.bookingId}', 'confirmed')" ${booking.status === 'confirmed' ? 'disabled' : ''}>
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="updateBookingStatus('${booking.bookingId}', 'pending')" ${booking.status === 'pending' ? 'disabled' : ''}>
                            <i class="fas fa-clock"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="updateBookingStatus('${booking.bookingId}', 'cancelled')" ${booking.status === 'cancelled' ? 'disabled' : ''}>
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="deleteBooking('${booking.bookingId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewBooking(bookingId) {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (!booking) {
        showNotification('Booking tidak ditemukan', 'error');
        return;
    }
    
    const appointmentDate = new Date(booking.appointmentInfo.datetime);
    const formattedDate = appointmentDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const servicesHTML = booking.serviceInfo.selectedOptions ? booking.serviceInfo.selectedOptions.map(option => `
        <div style="background: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid #3498db;">
            <div style="font-weight: bold; font-size: 14px;">${option.name}</div>
            <div style="color: #666; font-size: 13px;">${option.price}</div>
        </div>
    `).join('') : '';
    
    const content = `
        <div class="form-container" style="box-shadow: none; padding: 0;">
            <div class="form-group">
                <label>ID Booking</label>
                <div class="form-control" style="background: #f8f9fa;">${booking.bookingId}</div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Nama Pasien</label>
                    <div class="form-control" style="background: #f8f9fa;">${booking.patientInfo.name}</div>
                </div>
                <div class="form-group">
                    <label>Telepon</label>
                    <div class="form-control" style="background: #f8f9fa;">${booking.patientInfo.phone}</div>
                </div>
            </div>
            
            <div class="form-group">
                <label>Alamat</label>
                <div class="form-control" style="background: #f8f9fa; min-height: 80px;">${booking.patientInfo.address}</div>
            </div>
            
            <div class="form-group">
                <label>Layanan</label>
                <div class="form-control" style="background: #f8f9fa;">${booking.serviceInfo.serviceName}</div>
            </div>
            
            ${servicesHTML ? `
            <div class="form-group">
                <label>Detail Layanan</label>
                ${servicesHTML}
            </div>
            ` : ''}
            
            <div class="form-row">
                <div class="form-group">
                    <label>Tanggal Perawatan</label>
                    <div class="form-control" style="background: #f8f9fa;">${formattedDate}</div>
                </div>
                <div class="form-group">
                    <label>Jam Perawatan</label>
                    <div class="form-control" style="background: #f8f9fa;">${booking.appointmentInfo.time}</div>
                </div>
            </div>
            
            <div class="form-group">
                <label>Status</label>
                <div class="form-control" style="background: #f8f9fa;">
                    <span class="status status-${booking.status}">${getStatusText(booking.status)}</span>
                </div>
            </div>
            
            <div class="form-group">
                <label>Catatan</label>
                <div class="form-control" style="background: #f8f9fa; min-height: 80px;">${booking.patientInfo.notes}</div>
            </div>
            
            <div class="form-group">
                <label>Tanggal Booking</label>
                <div class="form-control" style="background: #f8f9fa;">${new Date(booking.bookingDate).toLocaleString('id-ID')}</div>
            </div>
        </div>
        
        <div class="form-actions">
            <button class="btn btn-primary" onclick="printBookingDetails('${booking.bookingId}')">
                <i class="fas fa-print"></i> Cetak
            </button>
            <button class="btn btn-secondary" onclick="closeModal('bookingDetailModal')">
                <i class="fas fa-times"></i> Tutup
            </button>
        </div>
    `;
    
    document.getElementById('bookingDetailContent').innerHTML = content;
    openModal('bookingDetailModal');
}

function updateBookingStatus(bookingId, newStatus) {
    const bookingIndex = bookings.findIndex(b => b.bookingId === bookingId);
    if (bookingIndex === -1) {
        showNotification('Booking tidak ditemukan', 'error');
        return;
    }
    
    bookings[bookingIndex].status = newStatus;
    bookings[bookingIndex].lastUpdated = new Date().toISOString();
    
    saveData();
    displayAllBookings();
    displayRecentBookings();
    displayDashboardData();
    
    showNotification(`Status booking berhasil diubah menjadi ${getStatusText(newStatus)}`, 'success');
}

function deleteBooking(bookingId) {
    if (!confirm('Apakah Anda yakin ingin menghapus booking ini?')) {
        return;
    }
    
    const bookingIndex = bookings.findIndex(b => b.bookingId === bookingId);
    if (bookingIndex === -1) {
        showNotification('Booking tidak ditemukan', 'error');
        return;
    }
    
    bookings.splice(bookingIndex, 1);
    saveData();
    displayAllBookings();
    displayRecentBookings();
    displayDashboardData();
    
    showNotification('Booking berhasil dihapus', 'success');
}

function showAddBookingModal() {
    // Populate service options
    const serviceSelect = document.getElementById('newService');
    serviceSelect.innerHTML = '<option value="">Pilih Layanan</option>';
    
    Object.keys(services).forEach(serviceId => {
        const service = services[serviceId];
        serviceSelect.innerHTML += `<option value="${serviceId}">${service.title}</option>`;
    });
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('newAppointmentDate').value = tomorrow.toISOString().split('T')[0];
    
    // Populate time options
    const timeSelect = document.getElementById('newAppointmentTime');
    timeSelect.innerHTML = '<option value="">Pilih Jam</option>';
    
    for (let hour = 8; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 17 && minute > 0) break;
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeSelect.innerHTML += `<option value="${time}">${time}</option>`;
        }
    }
    
    openModal('addBookingModal');
}

// ===== SERVICE MANAGEMENT =====
function displayServiceCategories() {
    const tableBody = document.getElementById('serviceCategoriesTable');
    const serviceIds = Object.keys(services);
    
    if (serviceIds.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-concierge-bell" style="font-size: 2rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                    <p>Tidak ada kategori layanan</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = serviceIds.map(serviceId => {
        const service = services[serviceId];
        const optionCount = service.options ? service.options.length : 0;
        
        return `
            <tr>
                <td>${serviceId}</td>
                <td>${service.title}</td>
                <td>${optionCount} layanan</td>
                <td><span class="status status-confirmed">Aktif</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="editService('${serviceId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteService('${serviceId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function displayServiceOptions() {
    const grid = document.getElementById('serviceOptionsGrid');
    let allOptions = [];
    
    // Collect all service options from all categories
    Object.keys(services).forEach(serviceId => {
        const service = services[serviceId];
        if (service.options) {
            service.options.forEach(option => {
                allOptions.push({
                    ...option,
                    category: service.title,
                    categoryId: serviceId
                });
            });
        }
    });
    
    if (allOptions.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <i class="fas fa-concierge-bell" style="font-size: 2rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                <p>Tidak ada layanan</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = allOptions.map(option => {
        return `
            <div class="service-option-card">
                <div class="service-option-header">
                    <div>
                        <h4>${option.name}</h4>
                        <p style="color: #7f8c8d; font-size: 0.9rem; margin: 0.5rem 0;">${option.category}</p>
                        <p style="font-weight: bold; color: #3498db; margin: 0;">${option.price}</p>
                    </div>
                    <img src="${option.image}" alt="${option.name}" class="service-option-image" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjhmOGY4IiByeD0iOCIvPgo8dGV4dCB4PSI0MCIgeT0iNDIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1nPC90ZXh0Pgo8L3N2Zz4K'">
                </div>
                <div class="service-option-actions">
                    <button class="btn btn-primary btn-sm" onclick="editServiceOption('${option.categoryId}', '${option.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteServiceOption('${option.categoryId}', '${option.id}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddServiceModal() {
    openModal('addServiceModal');
}

function showAddServiceOptionModal() {
    // Populate service categories
    const serviceSelect = document.getElementById('newOptionService');
    serviceSelect.innerHTML = '<option value="">Pilih Kategori</option>';
    
    Object.keys(services).forEach(serviceId => {
        const service = services[serviceId];
        serviceSelect.innerHTML += `<option value="${serviceId}">${service.title}</option>`;
    });
    
    openModal('addServiceOptionModal');
}

// ===== GALLERY MANAGEMENT =====
function displayGallery() {
    const grid = document.getElementById('galleryGrid');
    
    if (gallery.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <i class="fas fa-images" style="font-size: 2rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                <p>Tidak ada gambar di galeri</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = gallery.map((item, index) => {
        return `
            <div style="position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <img src="${item.url}" alt="${item.title}" style="width: 100%; height: 150px; object-fit: cover;"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjZjhmOGY4Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='">
                <div style="padding: 10px; background: white;">
                    <h4 style="margin: 0 0 5px 0; font-size: 0.9rem;">${item.title}</h4>
                    <p style="margin: 0; font-size: 0.8rem; color: #7f8c8d;">${item.description || 'Tidak ada deskripsi'}</p>
                </div>
                <div style="position: absolute; top: 10px; right: 10px;">
                    <button class="btn btn-danger btn-sm" onclick="deleteGalleryImage(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function showAddGalleryModal() {
    openModal('addGalleryModal');
}

function deleteGalleryImage(index) {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar ini dari galeri?')) {
        return;
    }
    
    gallery.splice(index, 1);
    saveData();
    displayGallery();
    
    showNotification('Gambar berhasil dihapus dari galeri', 'success');
}

// ===== FORM HANDLING =====
function setupForms() {
    // Add Booking Form
    document.getElementById('addBookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const serviceId = document.getElementById('newService').value;
        const service = services[serviceId];
        
        if (!service) {
            showNotification('Pilih layanan yang valid', 'error');
            return;
        }
        
        const bookingData = {
            bookingId: 'BK' + Date.now(),
            patientInfo: {
                name: document.getElementById('newPatientName').value,
                phone: document.getElementById('newPatientPhone').value,
                address: document.getElementById('newPatientAddress').value,
                notes: document.getElementById('newPatientNotes').value || 'Tidak ada catatan'
            },
            appointmentInfo: {
                date: document.getElementById('newAppointmentDate').value,
                time: document.getElementById('newAppointmentTime').value,
                datetime: new Date(document.getElementById('newAppointmentDate').value + 'T' + document.getElementById('newAppointmentTime').value)
            },
            serviceInfo: {
                serviceId: serviceId,
                serviceName: service.title,
                selectedOptions: [] // Simplified for admin-added bookings
            },
            status: 'pending',
            bookingDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        bookings.push(bookingData);
        saveData();
        displayAllBookings();
        displayRecentBookings();
        displayDashboardData();
        
        closeModal('addBookingModal');
        this.reset();
        
        showNotification('Booking berhasil ditambahkan', 'success');
    });
    
    // Add Service Form
    document.getElementById('addServiceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const serviceId = document.getElementById('newServiceId').value;
        const serviceTitle = document.getElementById('newServiceTitle').value;
        const serviceDescription = document.getElementById('newServiceDescription').value;
        
        if (services[serviceId]) {
            showNotification('ID layanan sudah ada', 'error');
            return;
        }
        
        services[serviceId] = {
            title: serviceTitle,
            description: serviceDescription,
            type: "checkbox",
            options: []
        };
        
        saveData();
        displayServiceCategories();
        displayServiceOptions();
        
        closeModal('addServiceModal');
        this.reset();
        
        showNotification('Kategori layanan berhasil ditambahkan', 'success');
    });
    
    // Add Service Option Form
    document.getElementById('addServiceOptionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const serviceId = document.getElementById('newOptionService').value;
        const optionId = document.getElementById('newOptionId').value;
        const optionName = document.getElementById('newOptionName').value;
        const optionPrice = document.getElementById('newOptionPrice').value;
        const optionImage = document.getElementById('newOptionImage').value;
        
        if (!services[serviceId]) {
            showNotification('Kategori layanan tidak valid', 'error');
            return;
        }
        
        // Check if option ID already exists in this service
        if (services[serviceId].options.some(opt => opt.id === optionId)) {
            showNotification('ID layanan sudah ada dalam kategori ini', 'error');
            return;
        }
        
        services[serviceId].options.push({
            id: optionId,
            name: optionName,
            price: optionPrice,
            image: optionImage
        });
        
        saveData();
        displayServiceOptions();
        
        closeModal('addServiceOptionModal');
        this.reset();
        
        showNotification('Layanan berhasil ditambahkan', 'success');
    });
    
    // Add Gallery Form
    document.getElementById('addGalleryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const imageTitle = document.getElementById('newImageTitle').value;
        const imageUrl = document.getElementById('newImageUrl').value;
        const imageDescription = document.getElementById('newImageDescription').value;
        
        gallery.push({
            title: imageTitle,
            url: imageUrl,
            description: imageDescription,
            addedDate: new Date().toISOString()
        });
        
        saveData();
        displayGallery();
        
        closeModal('addGalleryModal');
        this.reset();
        
        showNotification('Gambar berhasil ditambahkan ke galeri', 'success');
    });
    
    // General Settings Form
    document.getElementById('generalSettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        settings.general = {
            clinicName: document.getElementById('clinicName').value,
            clinicAddress: document.getElementById('clinicAddress').value,
            clinicPhone: document.getElementById('clinicPhone').value,
            clinicEmail: document.getElementById('clinicEmail').value,
            businessHours: document.getElementById('businessHours').value
        };
        
        saveData();
        showNotification('Pengaturan umum berhasil disimpan', 'success');
    });
    
    // Social Settings Form
    document.getElementById('socialSettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        settings.social = {
            instagram: document.getElementById('instagramAccounts').value.split(',').map(s => s.trim()),
            facebook: document.getElementById('facebookAccounts').value.split(',').map(s => s.trim()),
            youtube: document.getElementById('youtubeAccounts').value.split(',').map(s => s.trim()),
            tiktok: document.getElementById('tiktokAccounts').value.split(',').map(s => s.trim())
        };
        
        saveData();
        showNotification('Pengaturan media sosial berhasil disimpan', 'success');
    });
}

// ===== UTILITY FUNCTIONS =====
function getStatusText(status) {
    const statusMap = {
        'pending': 'Menunggu',
        'confirmed': 'Dikonfirmasi',
        'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status;
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        
        // Set styles based on type
        if (type === 'error') {
            notification.style.borderLeftColor = 'var(--error-color)';
            notification.style.background = '#ffeaea';
        } else if (type === 'success') {
            notification.style.borderLeftColor = 'var(--success-color)';
            notification.style.background = '#f0f9f0';
        } else if (type === 'warning') {
            notification.style.borderLeftColor = 'var(--warning-color)';
            notification.style.background = '#fff3e0';
        } else {
            notification.style.borderLeftColor = 'var(--primary-color)';
            notification.style.background = '#f0f9f0';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
}

function showAllBookings() {
    // Switch to bookings page
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.menu-item[data-page="bookings"]').classList.add('active');
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('bookings').classList.add('active');
}

function exportBookings() {
    // Simple CSV export
    let csv = 'ID Booking,Nama Pasien,Telepon,Layanan,Tanggal,Jam,Status\n';
    
    bookings.forEach(booking => {
        csv += `"${booking.bookingId}","${booking.patientInfo.name}","${booking.patientInfo.phone}","${booking.serviceInfo.serviceName}","${booking.appointmentInfo.date}","${booking.appointmentInfo.time}","${getStatusText(booking.status)}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-alracare-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data booking berhasil diekspor', 'success');
}

function printBookingDetails(bookingId) {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (!booking) return;
    
    const printWindow = window.open('', '_blank');
    const servicesHTML = booking.serviceInfo.selectedOptions ? booking.serviceInfo.selectedOptions.map(option => `
        <div style="background: #f9f9f9; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid #3498db;">
            <div style="font-weight: bold; font-size: 14px;">${option.name}</div>
            <div style="color: #666; font-size: 13px;">${option.price}</div>
        </div>
    `).join('') : '';
    
    const printContent = `
        <html>
            <head>
                <title>Booking Details - ${booking.bookingId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; color: #333; }
                    .header { text-align: center; border-bottom: 4px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
                    .details { margin: 30px 0; }
                    .detail-item { margin: 15px 0; padding: 12px 0; border-bottom: 2px solid #eee; display: flex; justify-content: space-between; font-size: 14px; }
                    .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; padding-top: 20px; border-top: 2px solid #ddd; }
                    .status { background: #fff3e0; color: #f39c12; padding: 6px 15px; border-radius: 25px; font-weight: bold; font-size: 12px; border: 2px solid #f39c12; }
                    @media print { 
                        body { margin: 20px; }
                        .header { border-bottom-color: #000; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0; color: #3498db; font-size: 28px;">Alra Care</h1>
                    <h2 style="margin: 10px 0; color: #333; font-size: 22px;">Detail Booking</h2>
                    <p style="margin: 0; color: #666; font-size: 16px;">Kesehatan & Kecantikan Profesional</p>
                </div>
                <div class="details">
                    <div class="detail-item"><strong>Nomor Booking:</strong> <span>${booking.bookingId}</span></div>
                    <div class="detail-item"><strong>Nama Pasien:</strong> <span>${booking.patientInfo.name}</span></div>
                    <div class="detail-item"><strong>Telepon:</strong> <span>${booking.patientInfo.phone}</span></div>
                    <div class="detail-item"><strong>Alamat:</strong> <span>${booking.patientInfo.address}</span></div>
                    <div class="detail-item"><strong>Tanggal:</strong> <span>${booking.appointmentInfo.date}</span></div>
                    <div class="detail-item"><strong>Jam:</strong> <span>${booking.appointmentInfo.time}</span></div>
                    <div class="detail-item">
                        <strong>Layanan:</strong> 
                        <span>${booking.serviceInfo.serviceName}</span>
                    </div>
                    ${servicesHTML}
                    <div class="detail-item"><strong>Catatan:</strong> <span>${booking.patientInfo.notes}</span></div>
                    <div class="detail-item"><strong>Status:</strong> <span class="status">${getStatusText(booking.status)}</span></div>
                </div>
                <div class="footer">
                    <p style="font-weight: bold; font-size: 14px;">Harap datang 15 menit sebelum jadwal perawatan</p>
                    <p>Bawa bukti booking ini saat datang ke klinik</p>
                    <p>Terima kasih atas kepercayaan Anda kepada Alra Care</p>
                    <p>Jl. Akcaya, Pontianak • 0813-8122-3811</p>
                    <p>www.alracare.com • rahmadramadhanaswin@gmail.com</p>
                </div>
            </body>
        </html>
    `;
    
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }
}

// Placeholder functions for future implementation
function editService(serviceId) {
    showNotification('Fitur edit layanan akan segera tersedia', 'info');
}

function deleteService(serviceId) {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori layanan ini? Semua layanan dalam kategori ini juga akan dihapus.')) {
        return;
    }
    
    delete services[serviceId];
    saveData();
    displayServiceCategories();
    displayServiceOptions();
    displayDashboardData();
    
    showNotification('Kategori layanan berhasil dihapus', 'success');
}

function editServiceOption(categoryId, optionId) {
    showNotification('Fitur edit layanan akan segera tersedia', 'info');
}

function deleteServiceOption(categoryId, optionId) {
    if (!confirm('Apakah Anda yakin ingin menghapus layanan ini?')) {
        return;
    }
    
    const service = services[categoryId];
    if (service && service.options) {
        const optionIndex = service.options.findIndex(opt => opt.id === optionId);
        if (optionIndex !== -1) {
            service.options.splice(optionIndex, 1);
            saveData();
            displayServiceOptions();
            displayDashboardData();
            
            showNotification('Layanan berhasil dihapus', 'success');
        }
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});