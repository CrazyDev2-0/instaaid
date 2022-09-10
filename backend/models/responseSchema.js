const Utils = require("../helpers/utils");

class ResponseSchema{
    constructor(){
        this.success = false;
        this.code = 500;
        this.message = "";
        this.error = "";
        this.payload = {};
        this.recordCount = -1;
    }

    // Set data
    setSuccess(success, message){
        this.success = success;
        if(success) this.message = message;
        else this.error = message;
    }

    setPayload(payload) {
        this.payload = payload
    };

    setStatusCode(code){
        this.code = code;
    }

    setRecordCount(count){
        this.recordCount = count;
    }

    getStatusCode(){
        return this.code;
    }

    // Return JSON to send to user
    /**
     * @return {{code: number, payload: (*|{}|{}), success: boolean, message: (string)}}
     */
    toJSON(){
        const data = {
            success: this.success,
            code: this.code,
            message: this.success ? this.message : Utils.handleNullString(this.error) === "" ? "Some error happened ! Try later" : this.error ,
            payload: this.payload || {}
        };
        if(this.recordCount !== -1){
            data["recordCount"] = this.recordCount;
        }
        return data;
    }
}

module.exports = ResponseSchema;