const fs = require('fs');
const csv = require('csv-parser');

// Чтение данных из CSV-файла
const data = [];
fs.createReadStream('input.csv')
  .pipe(csv({ separator: ';' }))
  .on('data', (row) => {
    data.push({
      "Дата транзакции": row["Дата транзакции"],
      "Операция": row["Операция"],
      "Сумма": parseFloat(row["Сумма"].replace(',', '.')),
      "Валюта": row["Валюта"],
      "Дата операции по счету": row["Дата операции по счету"],
      "Комиссия/Money-back": parseFloat(row["Комиссия/Money-back"].replace(',', '.')),
      "Обороты по счету": parseFloat(row["Обороты по счету"].replace(',', '.')),
      "Цифровая карта": row["Цифровая карта"],
      "Категория операции": row["Категория операции"],
      "Номер контракта": parseInt(row["Номер контракта"].split()[0]),
      "Карта": row["Карта"],
      "Валюта контракта": row["Валюта контракта"]
    });
  })
  .on('end', () => {
    // Переименование ключей
    const keyMapping = {
      'Дата транзакции': 'operationDate',
      'Операция': 'operation',
      'Сумма': 'summ',
      'Валюта': 'currency',
      'Дата операции по счету': 'transactionDate',
      'Комиссия/Money-back': 'comission',
      'Обороты по счету': 'summInAccountCurrency',
      'Цифровая карта': 'isVirtualCard',
      'Категория операции': 'operationType',
      'Номер контракта': 'contractNum',
      'Карта': 'accountCard',
      'Валюта контракта': 'accountCurrency'
    };

    const transformedData = data.map((row) => {
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [keyMapping[key], value])
      );
    });

    // Сохранение данных в JSON-файл
    fs.writeFileSync('output.json', JSON.stringify(transformedData, null, 2));
  });
