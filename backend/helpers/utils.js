const CryptoJS = require('crypto-js');

class Utils {
    /**
     * Specially handle Null Strings. If the string is null, it will return an empty string rather than null value
     * @return {string}
     */
    static handleNullString(str) {
        if (!str) {
            return "";
        }
        return str;
    }

    /**
     * Specially handle Integers. If its null will return 0, Or parseInt fail at any reason will send also 0, we can also specify the default return value, however not required
     * @param val {string || number}
     * @param default_value {number} [default_value=0]
     * @return {number}
     */
    static parseToInt(val, default_value=0) {
        if(!val) return default_value;
        const x = parseInt(val);
        if (x == null || x.toString() === "undefined" || x.toString() === "NaN" || isNaN(x)) return default_value;
        return x;
    }

    /**
     * Specially handle Integers. If its null will return 0, Or parseInt fail at any reason will send also 0, we can also specify the default return value, however not required
     * @param val {string || number}
     * @param default_value {number} [default_value=0]
     * @return {number}
     */
    static parseToFloat(val, default_value=0.0) {
        if(!val) return default_value;
        const x = parseFloat(val);
        if (x == null || x.toString() === "undefined" || x.toString() === "NaN" || isNaN(x)) return default_value;
        return x;
    }

    /**
     * Parse nullable booleans values
     * @param {String} text
     * @return {boolean}
     */
    static parseBool(text) {
        text = (text === undefined || text == null) ? "undefined" : text.toString();
        if (text === "undefined" || text === "null") return false;
        text = text.trim();
        return text === "true" || text === "TRUE";
    }

    /**
     * @param  {Object} json_obj
     * @param  {string[]} keys
     * @return {boolean}
     */
    static checkParamsPresence(json_obj, keys) {
        if(json_obj == null)  return false;
        for (let i = 0; i < keys.length; i++) {
            if ((json_obj[keys[i]] == undefined || json_obj[keys[i]] == null) && json_obj[keys[i]] !== 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Return date formatted string. Accepts both date in TZ string format or  date object
     * @param date{string|Date}
     * @return {string}
     */
    static formatDate(date) {
        if (date == null) return "---";
        let  x_date = typeof date == 'string' ? new Date(date) : date;
        return `${x_date.getDate()}-${x_date.getMonth() + 1}-${x_date.getFullYear()}`;
    }

    /**
     * Return formatted time string in am/pm format. Accepts both datetime in TZ string format or date object
     * @param date {string|Date}
     * @return {string}
     */
    static formatAMPM(date) {
        if (date == null) return "---";
        let x_date = typeof date == 'string' ? new Date(date) : date;
        let hours = x_date.getHours();
        let minutes = x_date.getMinutes();
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? "0" + minutes : minutes;
        return hours + ":" + minutes + " " + ampm;
    }

    /**
     * Return formatted datetime string of current  timestamp in am/pm format. Accepts both datetime in TZ string format or date object
     * @param date {string|Date}
     * @return {string}
     */
    static formatDateTime(date){
        return this.formatDate(date)+" "+this.formatAMPM(date);
    }

    /**
     * Return formatted datetime string of current  timestamp in am/pm format
     * @return {string}
     */
    static getCurrentFormattedAMPM(){
        const datetime = new  Date(Date.now());
        return this.formatDateTime(datetime);
    }

    /**
     * String to base64
     * @param str
     * @return {string}
     */
    static stringToBase64(str) {
        return Buffer.from(str).toString("base64");
    }

    /**
     * Base64 to String
     * @param str
     * @return {string}
     */
    static base64ToString(str) {
        return Buffer.from(str, "base64").toString("ascii");
    }

    /**
     * Generate Random OTP
     * @return {string}
     */
    static generateOTP() {
        return Math.floor(10000 + Math.random() * 90000).toString();
    }

    /**
     * Generate Random Token
     * @return {string}
     */
    static generateRandomToken(byteLength=32) {
        return require('crypto').randomBytes(byteLength).toString("hex");
    }

    /**
     * Generate Random String
     * @return {string}
     */
    static generateRandomString(len=6){
        return require('crypto').randomBytes(Math.ceil(len/2)).toString('hex').slice(0,len);
    }

    /**
     * Generate Hash of string
     * @param str {string}
     * @return {string}
     */
    static generateHash(str) {
        return require('crypto').createHash('sha256').update(str).digest('hex');
    }

    
    static encryptAES(input) {
        try {
            var text = input;
            var key = '11A1764225B11AA1'; // to ensure AES-128 this has to be 16 bit
            
            text = CryptoJS.enc.Hex.parse(text);
            key = CryptoJS.enc.Hex.parse(key);
            var iv = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");
            var encrypted = CryptoJS.AES.encrypt(text, key, { iv: iv, mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.ZeroPadding });
            encrypted = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
            return encrypted;
        } catch (ex) {
          // handle error
          // most likely, entropy sources are drained
          console.error(ex);
        }
    }

    static decryptAES(encoded) { 	
       
    }

    static getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = Utils.deg2rad(lat2-lat1);  // deg2rad below
        var dLon = Utils.deg2rad(lon2-lon1); 
        var a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(Utils.deg2rad(lat1)) * Math.cos(Utils.deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
          ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d;
      }
      
    static deg2rad(deg) {
        return deg * (Math.PI/180)
    }
}

module.exports = Utils;