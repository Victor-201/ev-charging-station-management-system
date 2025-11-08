const mockUser = {
  id: 'user-123',
  full_name: 'Nguyễn Văn A',
  email: 'test@example.com',
  phone_number: '0987654321',
  avatar_url: `https://i.pravatar.cc/150?u=a042581f4e29026704d`,
};

const mockWallet = {
  id: 'wallet-123',
  user_id: 'user-123',
  balance: 250000,
};

const mockWalletTransactions = [
  { id: 'wt-1', type: 'topup', amount: 500000, created_at: '2025-11-08T02:00:00Z', status: 'completed' },
  { id: 'wt-2', type: 'payment', amount: -75000, created_at: '2025-11-07T10:30:00Z', status: 'completed', description: 'Sạc tại Vincom' },
  { id: 'wt-3', type: 'withdraw', amount: -100000, created_at: '2025-11-06T18:00:00Z', status: 'completed' },
  { id: 'wt-4', type: 'refund', amount: 25000, created_at: '2025-11-05T11:45:00Z', status: 'completed', description: 'Hoàn tiền sự cố sạc' },
  { id: 'wt-5', type: 'payment', amount: -55000, created_at: '2025-11-04T09:15:00Z', status: 'completed', description: 'Sạc tại Landmark 81' },
];

const mockStations = [
    {
      id: 's1',
      station_id: 's1',
      name: 'Trạm sạc Central Park',
      address: '208 Nguyễn Hữu Cảnh, P. 22, Q. Bình Thạnh, TP.HCM',
      latitude: 10.7852,
      longitude: 106.7219,
      available_ports: 3,
      total_ports: 4,
      price_per_kwh: 1985,
      connector_types: ['Type 2', 'CCS2'],
      status: 'active',
      rating: 4.7,
      amenities: ['Wifi miễn phí', 'Nhà vệ sinh', 'Cửa hàng tiện lợi'],
      distance: 0.5
    },
    {
      id: 's2',
      station_id: 's2',
      name: 'Trạm sạc Landmark 81',
      address: '720A Điện Biên Phủ, P. 22, Q. Bình Thạnh, TP.HCM',
      latitude: 10.7946,
      longitude: 106.7218,
      available_ports: 1,
      total_ports: 6,
      price_per_kwh: 2200,
      connector_types: ['Type 2', 'CCS2', 'CHAdeMO'],
      status: 'active',
      rating: 4.8,
      amenities: ['Trung tâm thương mại', 'Nhà hàng', 'Bãi đỗ xe có mái che'],
      distance: 3.2
    },
    {
      id: 's3',
      station_id: 's3',
      name: 'Trạm sạc Vincom Đồng Khởi',
      address: '72 Lê Thánh Tôn, P. Bến Nghé, Q.1, TP.HCM',
      latitude: 10.7788,
      longitude: 106.7045,
      available_ports: 0,
      total_ports: 2,
      price_per_kwh: 1800,
      connector_types: ['Type 2'],
      status: 'active',
      rating: 4.2,
      amenities: ['Trung tâm thương mại', 'Rạp chiếu phim'],
      distance: 1.8
    },
    {
      id: 's4',
      station_id: 's4',
      name: 'Trạm sạc Emart Gò Vấp',
      address: '366 Phan Văn Trị, P. 5, Q. Gò Vấp, TP.HCM',
      latitude: 10.8231,
      longitude: 106.6872,
      available_ports: 5,
      total_ports: 5,
      price_per_kwh: 2000,
      connector_types: ['CCS2'],
      status: 'maintenance',
      rating: 4.4,
      amenities: ['Siêu thị', 'Khu ăn uống'],
      distance: 7.5
    },
];

const mockChargingSessions = [
    {
        id: 'cs1',
        station_name: 'Trạm sạc Central Park',
        start_time: '2025-11-07T10:00:00Z',
        end_time: '2025-11-07T10:30:00Z',
        duration: 1800, // seconds
        energy_consumed: 12.5,
        cost: 24812,
        invoice_id: 'inv-001'
    },
    {
        id: 'cs2',
        station_name: 'Trạm sạc Landmark 81',
        start_time: '2025-11-04T09:00:00Z',
        end_time: '2025-11-04T09:15:00Z',
        duration: 900, // seconds
        energy_consumed: 25.0,
        cost: 55000,
        invoice_id: 'inv-002'
    }
];

const mockReservations = [
    {
        id: 'res-1',
        station_id: 's1',
        station_name: 'Trạm sạc Central Park',
        address: '208 Nguyễn Hữu Cảnh, P. 22, Q. Bình Thạnh, TP.HCM',
        date: '2025-11-10',
        time: '09:00 - 10:00',
        start_time: '09:00',
        end_time: '10:00',
        port_type: 'CCS2',
        connector_type: 'CCS2',
        status: 'confirmed',
        estimated_cost: 60000,
        station: mockStations[0]
    },
    {
        id: 'res-2',
        station_id: 's2',
        station_name: 'Trạm sạc Landmark 81',
        address: '720A Điện Biên Phủ, P. 22, Q. Bình Thạnh, TP.HCM',
        date: '2025-11-09',
        time: '14:00 - 15:00',
        start_time: '14:00',
        end_time: '15:00',
        port_type: 'Type 2',
        connector_type: 'Type 2',
        status: 'completed',
        estimated_cost: 66000,
        station: mockStations[1]
    },
    {
        id: 'res-3',
        station_id: 's4',
        station_name: 'Trạm sạc Emart Gò Vấp',
        address: '366 Phan Văn Trị, P. 5, Q. Gò Vấp, TP.HCM',
        date: '2025-11-08',
        time: '18:00 - 19:00',
        start_time: '18:00',
        end_time: '19:00',
        port_type: 'CCS2',
        connector_type: 'CCS2',
        status: 'cancelled',
        estimated_cost: 60000,
        station: mockStations[3]
    }
];

const mockApi = (data, delay = 500) => 
    new Promise(resolve => setTimeout(() => resolve({ data }), delay));

const mockApiError = (message, delay = 500) =>
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), delay));

const mockService = {
    // Auth
    login: (email, password) => {
        if (email === 'test@example.com' && password === 'password') {
            return mockApi({ user: mockUser, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
        }
        return mockApiError('Email hoặc mật khẩu không đúng.');
    },
    register: (userData) => mockApi({ user: { ...mockUser, ...userData }, message: 'Đăng ký thành công' }),
    logout: () => mockApi({ message: 'Đăng xuất thành công' }),
    getMe: () => mockApi(mockUser),

    // Stations
    getStations: () => mockApi(mockStations),
    getStationById: (id) => {
        const station = mockStations.find(s => s.id === id);
        return station ? mockApi(station) : mockApiError('Không tìm thấy trạm sạc');
    },

    // Wallet
    getWallet: (userId) => mockApi(mockWallet),
    getWalletTransactions: (userId, { limit } = {}) => {
        const data = limit ? mockWalletTransactions.slice(0, limit) : mockWalletTransactions;
        return mockApi(data);
    },
    topupWallet: (data) => mockApi({ ...data, status: 'completed' }),
    withdrawFromWallet: (data) => mockApi({ ...data, status: 'pending' }),

    // Charging
    getChargingHistory: (userId) => mockApi(mockChargingSessions),
    getSession: (sessionId) => {
        const session = mockChargingSessions.find(s => s.id === sessionId);
        return session ? mockApi(session) : mockApiError('Không tìm thấy phiên sạc');
    },
    getSessionEvents: (sessionId) => mockApi({ events: [
        { event_type: 'SessionStart', message: 'Bắt đầu sạc', timestamp: '2025-11-07T10:00:05Z' },
        { event_type: 'ChargingProgress', message: 'Đã sạc 5 kWh', timestamp: '2025-11-07T10:15:00Z' },
        { event_type: 'SessionEnd', message: 'Kết thúc sạc', timestamp: '2025-11-07T10:30:10Z' },
    ]}),

    // Reservations
    getUserReservations: (userId) => mockApi(mockReservations),
    getReservationById: (id) => {
        const reservation = mockReservations.find(r => r.id === id);
        return reservation ? mockApi(reservation) : mockApiError('Không tìm thấy đặt chỗ');
    },
    getAvailableSlots: (stationId, date) => {
        // Simulate some slots being unavailable
        const slots = [
            { id: 't1', time: '08:00', duration: 60, available: true },
            { id: 't2', time: '09:00', duration: 60, available: false },
            { id: 't3', time: '10:00', duration: 60, available: true },
            { id: 't4', time: '11:00', duration: 60, available: true },
        ];
        return mockApi(slots);
    },
    createReservation: (data) => mockApi({ ...data, id: `res-${Date.now()}`, status: 'confirmed' }),
    cancelReservation: (id) => mockApi({ id, status: 'cancelled' }),
};

export default mockService;

