const app = Vue.createApp({
    data() {
        return {
            positionInfo: {},
            errMessage: '',
            markers: []
        };
    },
    methods: {
        // 顯示座標資訊
        showCoords(latitude, longitude) {
            if (latitude === undefined || longitude === undefined) {
                this.positionInfo = {};
                return;
            }
            this.positionInfo = {
                latitude: latitude.toFixed(6),
                longitude: longitude.toFixed(6)
            };
        }
    }
});
const vm = app.mount('#app');

// 初始化Leaflet地圖，設定預設中心點和縮放等級
const map = L.map('map').setView([20, 0], 2);

// 加入OpenStreetMap圖磚，註明版權資訊及設定最大縮放等級
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);

// 使用者位置標記及範圍圈
let userMarker = null;
let userAccuracyCircle = null;

// 縮放等級簡單對照表
const zoomLevels = {
    WordMap: 2,
    LargeCountry: 5,
    RegionState: 8,
    City: 11,
    Neiberhood: 13,
    Street: 15,
    Block: 17,
    Building: 19
}

function showLocation(position) {
    // 測試經緯度: 25.033964, 121.564468 (台北101)
    const { latitude, longitude, accuracy } = position.coords;

    // 移除舊的使用者位置標記和精確度圈
    if (userMarker) map.removeLayer(userMarker);
    if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);

    // 加入範圍圈，半徑為精確度值
    userAccuracyCircle = L.circle([latitude, longitude], {
        radius: accuracy,
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.1,
        weight: 1
    }).addTo(map);

    // 加入使用者位置標記並顯示資訊
    userMarker = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(
            `<strong>現在位置</strong><br>
             緯度: ${latitude.toFixed(6)}<br>
             經度: ${longitude.toFixed(6)}<br>
             精確度: ±${Math.round(accuracy)} m`
        )
        .openPopup();

    // 飛至指定位置並設定適當縮放等級
    map.flyTo([latitude, longitude], zoomLevels.Block, { duration: 1.5 });
    vm.showCoords(latitude, longitude);
}

function handleError(error) {
    const messages = {
        1: 'Permission denied. Please allow location access.',
        2: 'Position unavailable. Unable to determine location.',
        3: 'Request timed out. Try again.'
    };
    vm.errMessage = messages[error.code] || 'An unknown error occurred.';
}
// 透過瀏覽器 Geolocation API 取得使用者位置(需經使用者同意)
function getLocation() {
    if (!navigator.geolocation) {
        vm.errMessage = 'Geolocation is not supported by your browser.';
        return;
    }
    vm.errMessage = 'Detecting your location…';
    navigator.geolocation.getCurrentPosition(showLocation, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
}

// 滑鼠移動時顯示對應座標
map.on('mousemove', (e) => {
    vm.showCoords(e.latlng.lat, e.latlng.lng);
});
map.on('mouseout', () => {
    vm.showCoords();
});

// 點擊地圖時放置標記
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    const m = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(
            `<strong>自訂位置</strong><br>
             緯度: ${lat.toFixed(6)}<br>
             經度: ${lng.toFixed(6)}<br>
             <a href="#" onclick="removeClickMarker(this); return false;" style="color:#e74c3c;">移除</a>`
        )
        .openPopup();
    vm.markers.push(m);
});

function removeClickMarker(link) {
    const popup = link.closest('.leaflet-popup');
    const markerEl = popup?._leaflet_id != null ? popup : null;
    // 找到對應的標記並移除
    for (let i = vm.markers.length - 1; i >= 0; i--) {
        const m = vm.markers[i];
        if (m.isPopupOpen()) {
            map.removeLayer(m);
            vm.markers.splice(i, 1);
            break;
        }
    }
}

// 取得使用者位置並移動地圖到該位置
getLocation();