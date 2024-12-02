class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const qureyObj = { ...this.queryString };
    //this line of code tell us which we have to delete from the site..
    const excludeFields = ['page', 'sort', 'limit', 'fields'];

    //loopiing forEach element in queryObj to delte it from the site....
    excludeFields.forEach((el) => delete qureyObj[el]);

    let queryStr = JSON.stringify(qureyObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));

    //For greating or equal to...
    //{duration: 5, difficulty: { $gte: 5}}
    //{ duration: { gte: '6' }, difficulty: '5' }

    // const query = Tour.find(qureyObj);
    // let query = Tour.find(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }
  //req.query is replace by this.queryString..
  //query is replace by this.query..
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join('');
      console.log(sortBy);
      // query = query.sort(req.query.sort);
      this.query = this.query.sort(sortBy);
    } else {
      //if not sort is added then we must sort it by the time it is created at...
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // || is used to defining the default values...
    const limit = this.queryString.limit * 1 || 100;
    console.log(page);

    //so here basically what we are doing is seeing that skip
    //contain the page - 1 * limit value in which limit is by default set to 10..
    const skip = (page - 1) * limit;
    //page=2&limit=10
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
