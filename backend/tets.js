require('dotenv').config();

const utils = require("./helpers/utils");
const crypto = require("crypto");

// var x  = utils.encryption("ABCDEFGH12345678");
//console.log(x);
//console.log(utils.decryption(x));

// const pass_key = `test`;
// const salt = 'salt';
// const keylen = 32;
// const shared_key = crypto.scryptSync(pass_key,salt,keylen);
// console.log(shared_key)

var msg = "fdhfjjhfsjkfjhs";
console.log(utils.encryptAES(msg));
// console.log(utils.decryptAES("b3146fa1167d0195c826a81480de3fd0088ad4ecb295b8bdf63b49781e8ad1c5"))