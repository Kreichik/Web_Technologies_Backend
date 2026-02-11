$(document).ready(function() {
    const API_BASE_URL = ''; 
    
    let currentPage = window.location.pathname.split("/").pop() || 'index.html';
    
    if (window.location.hostname.includes('kaspi')) {
        currentPage = 'kaspi-pay.html';
    }

    function getUrlParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function apiCall(endpoint, method, data, successCallback, errorCallback) {
        const token = localStorage.getItem('token');
        const settings = {
            url: `${API_BASE_URL}${endpoint}`,
            method: method,
            contentType: 'application/json',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            success: successCallback,
            error: errorCallback || function(error) {
                console.error(`API Error on ${method} ${endpoint}:`, error);
                
                if (endpoint.includes('/confirm')) return; 

                const errorMessage = error.responseJSON?.message || error.responseJSON?.error || 'An unexpected error occurred.';
                
                if ((error.status === 401 || error.status === 403) && 
                    currentPage !== 'login.html' && 
                    currentPage !== 'register.html' && 
                    currentPage !== 'kaspi-pay.html') {
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                } else {
                    console.error(errorMessage);
                }
            }
        };
        if (data) {
            settings.data = JSON.stringify(data);
        }
        $.ajax(settings);
    }

    const pageInitializers = {
        'index.html': function() {
            setTimeout(() => $('#loading-progress-bar').css('width', '100%'), 100);
            setTimeout(() => {
                if (localStorage.getItem('token')) {
                    window.location.href = 'home.html';
                } else {
                    window.location.href = 'login.html';
                }
            }, 1500);
        },
        'home.html': function() {
            apiCall('/events', 'GET', null, (events) => {
                const container = $('#event-list-container').empty();
                if (!events || events.length === 0) {
                    container.html('<p class="text-white text-center col-12">No events found.</p>');
                    return;
                }
                events.forEach(event => {
                    const eventDate = new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                    const imageUrl = event.image || 'assets/images/poster.jpeg'; 
                    container.append(`
                        <div class="col-12 col-md-6 col-lg-4 mb-4">
                            <a href="event-details.html?id=${event._id}" class="event-card">
                                <img src="${imageUrl}" alt="${event.title}" class="event-card-poster">
                                <div class="event-card-overlay">
                                    <h3 class="overlay-title">${event.title}</h3>
                                    <p class="overlay-date">${eventDate}</p>
                                    <span class="overlay-link">View Details</span>
                                </div>
                            </a>
                        </div>`);
                });
            });
            
            apiCall('/auth/me', 'GET', null, (user) => {
                if(user.role === 'admin') {
                     $('.header-nav').prepend('<a href="admin.html" class="nav-link-item" style="font-size: 20px; border: 1px solid white; padding: 5px 15px; border-radius: 20px; margin-right: 15px;">Admin Panel</a>');
                }
                if(user.avatarUrl) {
                    $('.user-avatar img').attr('src', user.avatarUrl);
                }
            });
        },
        'event-details.html': function() {
            const eventId = getUrlParam('id');
            if (!eventId) return;

            apiCall(`/events/${eventId}`, 'GET', null, (event) => {
                const imageUrl = event.image || 'assets/images/poster.jpeg';
                $('#event-poster').attr('src', imageUrl).attr('alt', event.title);
                $('#event-title').text(event.title);
                $('#event-description').text(event.description || 'No description available.');
                $('#buy-ticket-btn').attr('href', `seat-selection.html?id=${event._id}`);
                $(document).attr('title', `TickTick - ${event.title}`);
            });

            apiCall('/auth/me', 'GET', null, (user) => {
                if(user.avatarUrl) {
                    $('.user-avatar img').attr('src', user.avatarUrl);
                }
            });
        },
        'seat-selection.html': function() {
            const eventId = getUrlParam('id');
            let selectedSeat = null;
            let eventPrice = 0;

            if(!eventId) { window.location.href = 'home.html'; return; }

            apiCall(`/events/${eventId}`, 'GET', null, (event) => {
                eventPrice = event.price;
            });

            apiCall(`/tickets/occupied/${eventId}`, 'GET', null, (occupiedSeats) => {
                const rows = ['A', 'B', 'C', 'D', 'E'];
                const cols = 8;
                const container = $('#seat-map');

                rows.forEach(row => {
                    for(let i=1; i<=cols; i++) {
                        const seatId = `${row}${i}`;
                        const isTaken = occupiedSeats.includes(seatId);
                        const statusClass = isTaken ? 'taken' : 'available';
                        
                        const seatEl = $(`<div class="seat ${statusClass}" data-seat="${seatId}">${seatId}</div>`);
                        
                        if(!isTaken) {
                            seatEl.click(function() {
                                $('.seat').removeClass('selected');
                                $(this).addClass('selected');
                                selectedSeat = seatId;
                                $('#selected-seat-display').text(selectedSeat);
                                $('#total-price-display').text(`₸${eventPrice}`);
                                $('#btn-create-payment').prop('disabled', false);
                            });
                        }
                        container.append(seatEl);
                    }
                });
            });

            $('#btn-create-payment').click(() => {
                if(selectedSeat) {
                    apiCall('/payments', 'POST', { amount: eventPrice, eventId, seatNumber: selectedSeat }, 
                        (payment) => {
                            window.location.href = `payment.html?paymentId=${payment._id}&amount=${eventPrice}&eventId=${eventId}&seat=${selectedSeat}`;
                        }
                    );
                }
            });
        },
        'payment.html': function() {
            const paymentId = getUrlParam('paymentId');
            const amount = getUrlParam('amount');
            const eventId = getUrlParam('eventId');
            const seat = getUrlParam('seat');
            let pollInterval = null;

            $('#payment-amount').text(`₸${amount}`);

            const paymentUrl = `https://kaspi.yaku.kz/?paymentId=${paymentId}&amount=${amount}`;


            const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentUrl)}`;
            $('#payment-qr').attr('src', qrApi);

            pollInterval = setInterval(checkPaymentStatus, 2000);

            function checkPaymentStatus() {
                apiCall(`/payments/${paymentId}/status`, 'GET', null, (response) => {
                    if(response.status === 'completed') {
                        clearInterval(pollInterval);
                        finalizeBooking();
                    }
                });
            }

            function finalizeBooking() {
                $('#payment-status-container').html('<h3 class="text-success fw-bold">Payment Received! Generating Ticket...</h3>');
                
                const ticketData = {
                    eventId: eventId,
                    seatNumber: seat,
                    price: parseFloat(amount),
                    isVip: false
                };

                apiCall('/tickets', 'POST', ticketData, 
                    () => {
                        setTimeout(() => {
                             window.location.href = 'profile.html';
                        }, 1500);
                    },
                    (err) => {
                        alert('Payment success, but booking failed (maybe seat taken?). Contact support.');
                    }
                );
            }
        },
        'kaspi-pay.html': function() {

            console.log("Kaspi Simulator Loaded");
        },
        'profile.html': function() {
            apiCall('/auth/me', 'GET', null, (user) => {
                $('#profile-fullname').text(`${user.firstName} ${user.lastName}`);
                $('#profile-email').text(user.email);
                
                if (user.birthDate) {
                    const dob = new Date(user.birthDate).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                    $('#profile-birthdate').text(dob);
                } else {
                    $('#profile-birthdate').text('N/A');
                }

                if (user.avatarUrl) {
                    $('#profile-image').attr('src', user.avatarUrl);
                    // $('#header-avatar').attr('src', user.avatarUrl);
                    $('.user-avatar img').attr('src', user.avatarUrl);
                }
            });

            apiCall('/tickets', 'GET', null, (tickets) => {
                const container = $('#profile-tickets-container').empty();
                if (!tickets || tickets.length === 0) {
                    container.html('<div class="col-12"><div class="ticket-info-card justify-content-center"><p>You have not purchased any tickets yet.</p></div></div>');
                    return;
                }
                
                tickets.forEach(ticket => {
                    const eventTitle = ticket.eventId ? ticket.eventId.title : 'Unknown Event';
                    const eventDate = ticket.eventId ? new Date(ticket.eventId.date).toLocaleDateString() : '';
                    const eventImage = ticket.eventId && ticket.eventId.image ? ticket.eventId.image : 'assets/images/poster.jpeg';
                    
                    const checkedStatus = ticket.checked ? '<span class="badge bg-success ms-2">Used</span>' : '';

                    const ticketHtml = `
                        <div class="col-12 col-md-6 mb-4">
                            <div class="ticket-info-card" onclick="openTicketModal('${ticket._id}', '${eventTitle}', '${eventDate}', '${ticket.seatNumber}')">
                                <img src="${eventImage}" alt="${eventTitle}" class="ticket-mini-poster">
                                <div class="ticket-details">
                                    <h4>${eventTitle}</h4>
                                    <p>${eventDate}</p>
                                    <p>Seat: <strong>${ticket.seatNumber}</strong> ${checkedStatus}</p>
                                    <p>Price: ₸${ticket.price}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    container.append(ticketHtml);
                });
            });

            window.openTicketModal = (id, title, date, seat) => {
                $('#qr-event-title').text(title);
                $('#qr-event-date').text(date);
                $('#qr-seat').text(seat);
                $('#qr-code-img').attr('src', `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${id}`);
                
                const modal = new bootstrap.Modal(document.getElementById('ticket-qr-modal'));
                modal.show();
            };

            $('#logout-btn').on('click', function() {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            });
        },
        'login.html': function() {
            $('#login-form').on('submit', function(event) {
                event.preventDefault();
                const email = $('#username').val();
                const password = $('#password').val();
                $('#login-error').addClass('d-none');
                
                apiCall('/auth/login', 'POST', { email, password }, 
                    (response) => {
                        localStorage.setItem('token', response.token);
                        window.location.href = 'home.html';
                    },
                    (error) => {
                        const msg = error.responseJSON?.message || 'Invalid credentials';
                        $('#login-error').text(msg).removeClass('d-none');
                    }
                );
            });
        },
        'register.html': function() {
            $('#register-form').on('submit', function(event) {
                event.preventDefault();
                const firstName = $('#first-name').val();
                const lastName = $('#last-name').val();
                const birthDate = $('#birth-date').val();
                const email = $('#email').val();
                const password = $('#password').val();
                
                $('#register-error').addClass('d-none');

                if (!firstName || !lastName || !birthDate || !email || !password) {
                     $('#register-error').text("All fields are required.").removeClass('d-none');
                     return;
                }

                const data = { 
                    firstName, 
                    lastName, 
                    birthDate, 
                    email, 
                    password, 
                    role: 'user' 
                };

                apiCall('/auth/register', 'POST', data,
                    () => {
                        alert('Registration successful! Please login.');
                        window.location.href = 'login.html';
                    },
                    (error) => {
                        const msg = error.responseJSON?.error || 'Registration failed';
                        $('#register-error').text(msg).removeClass('d-none');
                    }
                );
            });
        },
        'admin.html': function() {
            apiCall('/auth/me', 'GET', null, (user) => {
                if (user.role !== 'admin') {
                    alert('Access denied');
                    window.location.href = 'home.html';
                }
            });

            $('#admin-logout').click(() => {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            });

            function loadEvents() {
                apiCall('/events', 'GET', null, (events) => {
                    const tbody = $('#events-table-body').empty();
                    events.forEach(event => {
                        tbody.append(`
                            <tr>
                                <td><img src="${event.image}" style="height:50px;"></td>
                                <td>${event.title}</td>
                                <td>${new Date(event.date).toLocaleDateString()}</td>
                                <td>${event.location}</td>
                                <td>₸${event.price}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editEvent('${event._id}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteEvent('${event._id}')">Delete</button>
                                </td>
                            </tr>
                        `);
                    });
                });
            }

            window.clearEventForm = () => {
                $('#event-form')[0].reset();
                $('#event-id').val('');
                $('#eventModalLabel').text('Create Event');
            };

            $('#event-form').on('submit', function(e) {
                e.preventDefault();
                const id = $('#event-id').val();
                const data = {
                    title: $('#event-title').val(),
                    date: $('#event-date').val(),
                    location: $('#event-location').val(),
                    description: $('#event-desc').val(),
                    price: $('#event-price').val(),
                    image: $('#event-image').val() || 'assets/images/poster.jpeg'
                };

                const method = id ? 'PUT' : 'POST';
                const endpoint = id ? `/events/${id}` : '/events';

                apiCall(endpoint, method, data, () => {
                    bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
                    loadEvents();
                });
            });

            window.editEvent = (id) => {
                apiCall(`/events/${id}`, 'GET', null, (event) => {
                    $('#event-id').val(event._id);
                    $('#event-title').val(event.title);
                    $('#event-date').val(event.date.split('T')[0]);
                    $('#event-location').val(event.location);
                    $('#event-desc').val(event.description);
                    $('#event-price').val(event.price);
                    $('#event-image').val(event.image);
                    $('#eventModalLabel').text('Edit Event');
                    new bootstrap.Modal(document.getElementById('eventModal')).show();
                });
            };

            window.deleteEvent = (id) => {
                if(confirm('Delete this event?')) {
                    apiCall(`/events/${id}`, 'DELETE', null, loadEvents);
                }
            };

            function loadUsers() {
                apiCall('/users', 'GET', null, (users) => {
                    const tbody = $('#users-table-body').empty();
                    users.forEach(user => {
                        tbody.append(`
                            <tr>
                                <td><img src="${user.avatarUrl}" style="height:40px; border-radius:50%;"></td>
                                <td>${user.firstName} ${user.lastName}</td>
                                <td>${user.email}</td>
                                <td>${user.role}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">Delete</button>
                                </td>
                            </tr>
                        `);
                    });
                });
            }

            window.deleteUser = (id) => {
                if(confirm('Delete this user?')) {
                    apiCall(`/users/${id}`, 'DELETE', null, loadUsers);
                }
            };

            function loadTickets() {
                apiCall('/tickets', 'GET', null, (tickets) => {
                    const tbody = $('#tickets-table-body').empty();
                    tickets.forEach(ticket => {
                        const statusBadge = ticket.checked 
                            ? '<span class="badge bg-success">Checked</span>' 
                            : '<span class="badge bg-warning text-dark">Unchecked</span>';
                        
                        const eventTitle = ticket.eventId && ticket.eventId.title ? ticket.eventId.title : 'Deleted/Unknown';
                        
                        tbody.append(`
                            <tr>
                                <td>${eventTitle}</td>
                                <td>${ticket.userId}</td>
                                <td>${ticket.seatNumber}</td>
                                <td>${statusBadge}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="deleteTicket('${ticket._id}')">Delete</button>
                                </td>
                            </tr>
                        `);
                    });
                });
            }

            window.deleteTicket = (id) => {
                if(confirm('Delete this ticket?')) {
                    apiCall(`/tickets/${id}`, 'DELETE', null, loadTickets);
                }
            };

            loadEvents();
            loadUsers();
            loadTickets();

            let html5QrcodeScanner;
            const scannerModal = document.getElementById('scannerModal');

            scannerModal.addEventListener('shown.bs.modal', function () {
                html5QrcodeScanner = new Html5Qrcode("qr-reader");
                const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                
                html5QrcodeScanner.start({ facingMode: "environment" }, config, onScanSuccess);
            });

            scannerModal.addEventListener('hidden.bs.modal', function () {
                if (html5QrcodeScanner) {
                    html5QrcodeScanner.stop().then(() => {
                        html5QrcodeScanner.clear();
                    }).catch(err => console.error(err));
                }
                $('#scan-result').addClass('d-none');
            });

            let currentScannedTicketId = null;

            function onScanSuccess(decodedText, decodedResult) {
                html5QrcodeScanner.pause();
                currentScannedTicketId = decodedText;

                apiCall(`/tickets/${decodedText}`, 'GET', null, 
                    (ticket) => {
                        const eventTitle = ticket.eventId && ticket.eventId.title ? ticket.eventId.title : 'Unknown';
                        const statusHtml = ticket.checked 
                            ? '<span class="text-danger fw-bold">ALREADY USED</span>' 
                            : '<span class="text-success fw-bold">VALID (Not Checked)</span>';
                        
                        $('#scan-event').text(eventTitle);
                        $('#scan-seat').text(ticket.seatNumber);
                        $('#scan-user').text(ticket.userId);
                        $('#scan-status').html(statusHtml);
                        $('#scan-result').removeClass('d-none');
                        
                        if(ticket.checked) {
                            $('#btn-check-in').prop('disabled', true).text('Already Checked In');
                        } else {
                            $('#btn-check-in').prop('disabled', false).text('Check In (Mark as Used)');
                        }
                    },
                    (err) => {
                         alert('Invalid Ticket QR');
                         html5QrcodeScanner.resume();
                    }
                );
            }

            $('#btn-check-in').click(function() {
                if(currentScannedTicketId) {
                    apiCall(`/tickets/${currentScannedTicketId}`, 'PUT', { checked: true }, 
                        () => {
                            alert('Ticket checked in successfully!');
                            $('#scan-result').addClass('d-none');
                            html5QrcodeScanner.resume();
                            loadTickets();
                        },
                        (err) => alert('Error checking in ticket')
                    );
                }
            });
        }
    };

    function initializeCommonUI() {
        const savedCity = localStorage.getItem('selectedCity');
        if (savedCity) $('.location-selector span').text(savedCity);

        $('#city-modal .list-group-item').on('click', function() {
            const selectedCity = $(this).text();
            $('.location-selector span').text(selectedCity);
            localStorage.setItem('selectedCity', selectedCity);
            const modalEl = document.getElementById('city-modal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
        });

        $('#agree-offer-btn').on('click', () => {
            $('#offer-content').hide();
            $('#cat-content').show();
        });

        $('#offer-modal').on('hidden.bs.modal', () => {
            $('#cat-content').hide();
            $('#offer-content').show();
        });

        $('.user-avatar').on('click', function(e) {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }

    function startApp() {
        if (currentPage !== 'index.html' && currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'kaspi-pay.html') {
            initializeCommonUI();
        }
        
        const initializer = pageInitializers[currentPage];
        if (initializer) {
            initializer();
        }
    }

    startApp();
});