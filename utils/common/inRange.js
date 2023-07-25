function inRange(x = 0, min, max) {
    return ((x-min)*(x-max) <= 0);
}

export default inRange;