Парсер банковских выписок движения средств в формате HTML в JSON с сохранением в базу MongoDB

Проверяет транзакции на уникальность, если в базе уже имеется транзакция с суммой и временем, такая транзакция в базу не добавляется.

До запуска укажите требуемые параметры в файле .env по образцу .env.example

Сложить все выписки в формате html в папку details (по умолчанию, можно изменить в файле параметров .env) 

Создать базу данных DB_NAME по умолчанию  ``` bankdetails ``` 

Установить необходимые зависимости  ``` npm install ```

Запустить парсер   ```  node index.js  ```

или ```  npm run start  ```

