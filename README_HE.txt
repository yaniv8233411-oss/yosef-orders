Yosef Orders v1.6 - הוראות התקנה קצרות

1. עצור שרתים ישנים:
   בחלון CMD רשום:
   taskkill /F /IM node.exe

2. גבה את התיקייה הישנה שלך.

3. העתק את הקבצים מהתיקייה הזאת אל:
   C:\Users\Administrator\Desktop\yosef_orders_v15_cloud_ready
   להחליף index.html, server.js, package.json, start_local.bat.
   אם אתה רוצה לשמור הזמנות ישנות - אל תחליף orders.json.

4. הפעל:
   start_local.bat

5. במחשב הקופה פתח:
   http://localhost:3000/?station=1

6. בטלפון חייבים לפתוח את כתובת המחשב, לא localhost.
   בחלון השחור יופיע משהו כמו:
   Open phone on same WiFi: http://192.168.1.25:3000/
   את הכתובת הזאת לפתוח בטלפון.

חשוב: הטלפון והמחשב חייבים להיות על אותה רשת WiFi/ראוטר בשלב הזה.
אם הטלפון בחוץ/רשת אחרת, צריך שלב ענן/טאנל בהמשך.
