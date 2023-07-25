import moment from 'moment'


const getTimestamp = (now = true) => {
    const offset = 15000;

    // return moment().unix() * 1000 - offset;  // works flawlessly in some cases
    return moment().unix()*1000;
};


export default getTimestamp