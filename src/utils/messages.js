const genMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
};

const genLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    genMessage,
    genLocationMessage
}