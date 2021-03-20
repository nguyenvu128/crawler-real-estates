const removeBreakLineCharacter = (str) => {
    if(str === null){
        str = ""
    }
    return str.trim();
};

module.exports = {
    removeBreakLineCharacter
};