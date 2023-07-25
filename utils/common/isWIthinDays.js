const isWithinDays = (days = 1, startDate = new Date(), todayDate = new Date()) => {
    var endDate = new Date(new Date().setDate(todayDate.getDate() - days)); 
    const Difference_In_Time = startDate.getTime() - endDate.getTime();
    let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
        return Difference_In_Days > 0;
}

export default isWithinDays;
