'use strict';

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function getFormattedDate() {
  const date = new Date();
  const dateStr = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

  return dateStr;
}

function getFormattedDateISO(dateStr) {
  return new Date(dateStr).toISOString();
}

module.exports = { getKeyByValue, getFormattedDate, getFormattedDateISO};
