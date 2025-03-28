const fs = require('fs');
const path = require('path');
const Iconv = require('iconv').Iconv;
const { Tabletojson: tabletojson } = require('tabletojson');
const { MongoClient } = require('mongodb');
const {
  BASE_DETAILS_FOLDER = 'details',
  DETAILS_BANK = 'bgpb', //bgpb prior mtbank
  DETAILS_FOLDER = DETAILS_BANK,
  SHOW_ALL_LOGS = 'false',
  MONGO_URI = 'mongodb://192.168.1.66:27017/',
  TEST_PARSE = 'false',
  DB_NAME = 'bankdetails'
} = process.env;

const keys = {
  bgpb: {
    'Дата операции': 'operationDate',
    'Дата отражения': 'transactionDate',
    Операция: 'operation',
    'Тип операции': 'operationType',
    'Сумма в валюте операции': 'summ',
    'Валюта операции': 'currency',
    'Сумма в валюте счета': 'summInAccountCurrency',
    'Валюта счета': 'accountCurrency',
    'Место операции (страна, наименование точки, город)': 'operationPlace',
    'Код авторизации': 'authCode',
    МСС: 'MCC',
    'Вознаграждение клиенту по операции в валюте счета': 'cashback',
  },
  mtbank: {
    'Статус операции': 'status',
    'Дата совершения транзакции': 'operationDate',
    'Дата отражения по счету': 'transactionDate',
    'Описание операции': 'operation',
    'Вал тр.': 'currency',
    'Сумма в валюте транзакции': 'summ',
    'Сумма в валютекарт-счета, BYN': 'summInAccountCurrency',
    'Сумма в валютекарт-счета': 'summInAccountCurrency',
    'Место проведения транзакции': 'operationPlace',
    'Остатоккарт-счета, BYN': 'balance',
    Карточка: 'accountCard',
  },
  prior: {
    'Дата транзакции': 'operationDate',
    Операция: 'operation',
    Сумма: 'summ',
    Валюта: 'currency',
    'Дата операции по счету': 'transactionDate',
    'Комиссия/Money-back': 'comission',
    'Обороты по счету': 'summInAccountCurrency',
    'Цифровая карта': 'isVirtualCard',
    'Категория операции': 'operationType',
    'Номер контракта': 'contractNum',
    Карта: 'accountCard',
    'Валюта контракта': 'accountCurrency',
  },
};

const dirPath = path.join(__dirname, '.', BASE_DETAILS_FOLDER, DETAILS_FOLDER);
const test = TEST_PARSE === 'true' ? true : false;
const showAllLogs = SHOW_ALL_LOGS === 'true' ? true : false;
const converting = DETAILS_BANK === 'mtbank' ? true : false;
const convertingFrom = 'CP1251';
const iconv = new Iconv(convertingFrom, 'UTF-8');

const client = new MongoClient(MONGO_URI);
const global = { info: 0, haved: 0, writed: 0 };
fs.readdir(dirPath, (err, files) => {
  async function run() {
    try {
      const database = client.db(DB_NAME);
      const collection = database.collection(DETAILS_BANK);
      for (const file of files) {
        let message = fs.readFileSync(path.resolve(dirPath, file));

        if (converting) message = iconv.convert(message);
        const converted = tabletojson.convert(message);

        if (test || showAllLogs) {
          console.log(converted?.map((el, i) => [`index ${i}`, console.log(el)]));
          console.log(
            converted?.map((el) => [typeof el, `array: ${Array.isArray(el)}`, el.length])
          );
          console.log(converted.length);
        }

        let accountCard = '';
        let accountNum = '';
        let account = '';
        let mainData = [];

        if (DETAILS_BANK === 'bgpb') {
          accountCard = `${converted[0][3][1]} - ${converted[0][0][1]}`;
          accountNum = converted[0][1][1];
          account = converted[0][2][1];
          mainData = converted[5];
        }

        if (DETAILS_BANK === 'mtbank') {
          accountNum = converted[2][0][0] ? converted[2][0][0].split(' ')[4] : '';
          account = converted[2][0][0] ? converted[2][0][0].split(' ')[4] : '';
          mainData = converted[3];
        }

        if (DETAILS_BANK === 'prior') {
          // accountNum = converted[2][0][0] ? converted[2][0][0].split(' ')[4] : '';
          // account = converted[2][0][0] ? converted[2][0][0].split(' ')[4] : '';
          // mainData = converted[3];
          console.log(converted);
        }

        const accountData = { accountCard, accountNum };
        if (account) accountData.account = account;
        let info = 0;
        let haved = 0;
        let writed = 0;

        for (const row of mainData) {
          let newRow = {};
          if (test || showAllLogs) console.log('row', row);
          Object.keys(row).forEach((key) => {
            newRow[keys[DETAILS_BANK][key]] = row[key];
          });
          if (newRow.authCode || newRow.summ) {
            const summ = parseFloat(newRow.summ.replace(',', '.'), 10);
            if (newRow.summInAccountCurrency)
              newRow.summInAccountCurrency = parseFloat(
                newRow.summInAccountCurrency.replace(',', '.'),
                10
              );
            if (newRow.balance) {
              const balance = parseFloat(newRow.balance.replace(',', '.'));
              if (!Number.isNaN(balance)) newRow.balance = balance;
            }
            newRow = { ...accountData, ...newRow, summ };
            info++;
            const item = await collection.findOne({
              operationDate: newRow.operationDate,
              summ: newRow.summ,
              account: newRow.account,
            });
            if (item) {
              haved++;
              if (test || showAllLogs) console.log({ item });
            } else {
              if (newRow?.summ) {
                writed++;
                if (test) console.log({ newRow });
                else {
                  if (showAllLogs) console.log({ newRow });
                  await collection.insertOne(newRow);
                }
              } else console.error('Статус операции !== T', { newRow });
            }
          }
        }
        console.log('parsed', i);
        console.log('finded', f);
        console.log('writed', w);
        global.info = global.info + info;
        global.haved = global.haved + haved;
        global.writed = global.writed + writed;
      }
    } finally {
      await client.close();
      console.log(global);
    }
  }
  run().catch(console.dir);
});
