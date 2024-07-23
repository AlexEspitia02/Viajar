/* eslint-disable prettier/prettier */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'; // 從 vitest 引入測試函數
import dotenv from 'dotenv'; // 引入 dotenv 用於加載環境變量
import { connectToDb, getDb } from '../models/db'; // 從 db 模塊中引入連接和獲取資料庫的函數

dotenv.config(); // 加載 .env 文件中的環境變量

let db; // 宣告一個全域變數，用於存儲資料庫連接

// 定義一個異步函數 findPlacesByLocation
const findPlacesByLocation = async (minLat, maxLat, minLng, maxLng) => {
  db = getDb(); // 獲取資料庫連接
  return db
    .collection('places') // 查找 places 集合
    .find({
      'location.lat': { $gte: minLat, $lte: maxLat }, // 經緯度範圍篩選
      'location.lng': { $gte: minLng, $lte: maxLng },
      type: 'restaurant', // 僅查找餐廳類型
    })
    .toArray(); // 將結果轉換為數組
};

// 定義測試套件
describe('findPlacesByLocation', () => {
  // 在所有測試之前運行
  beforeAll(async () => {
    await new Promise((resolve, reject) => {
      connectToDb((err) => { // 連接資料庫
        if (err) return reject(err); // 若連接失敗則拒絕 Promise
        db = getDb(); // 成功後獲取資料庫連接
        resolve(); // 解決 Promise
      });
    });
  });

  // 在所有測試之後運行
  afterAll(async () => {
    if (db && db.client) {
      await db.client.close(); // 關閉資料庫連接
    }
  });

  // 定義具體的測試用例
  it('should return places within the given lat/lng bounds', async () => {
    // 模擬的地點數據
    const mockPlaces = [
      {
        location: { lat: 40.7128, lng: -74.006 },
        type: 'restaurant',
      },
      {
        location: { lat: 40.7127, lng: -74.005 },
        type: 'restaurant',
      },
    ];

    // 模擬資料庫集合和查詢
    db.collection = vi.fn().mockReturnValue({
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockPlaces),
      }),
    });

    // 調用被測函數並傳入經緯度範圍
    const result = await findPlacesByLocation(40.7127, 40.7129, -74.007, -74.005);

    // 斷言函數返回的結果應該等於 mockPlaces
    expect(result).toEqual(mockPlaces);
    // 斷言 db.collection 和 db.collection().find 被正確地調用
    expect(db.collection).toHaveBeenCalledWith('places');
    expect(db.collection().find).toHaveBeenCalledWith({
      'location.lat': { $gte: 40.7127, $lte: 40.7129 },
      'location.lng': { $gte: -74.007, $lte: -74.005 },
      type: 'restaurant',
    });
  });
});
