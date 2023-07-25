const dateRange = (startDate , endDate , checkDate , checkEndDate )=>{   
    const date = new Date(checkDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const date1 = new Date(checkEndDate);
    const start1 = new Date(startDate);
    const end1 = new Date(endDate);

    // console.log((date >= start && date <= end),"start")
    // console.log((date1 >= start1 && date1 <= end1),"End")

   return ((date >= start && date <= end) , date1 >= start1 && date1 <= end1)
}
export default dateRange;