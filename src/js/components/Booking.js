import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './amountwidget.js';
import { DatePicker } from './datepicker.js';
import { HourPicker } from './hourpicker.js';

export class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starter);
    thisBooking.dom.submit = thisBooking.dom.wrapper.querySelector(select.booking.submitTable);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    for (let table of thisBooking.dom.tables) { 
      table.addEventListener('click', function () {
        event.preventDefault();

        let numberTable = table.getAttribute(settings.booking.tableIdAttribute);
        numberTable = parseInt(numberTable); 
        if (table.classList.contains(classNames.booking.tableBooked)){
          alert('This table is booked. Choose another table, please.');
          return;
        } else {
          table.classList.add(classNames.booking.tableSelected);
        }
        for (let table of thisBooking.dom.tables) { 
          table.classList.remove(classNames.booking.tableSelected);
        }
        table.classList.add(classNames.booking.tableSelected);
        thisBooking.choosenTable = numberTable;
        console.log(table);
      });
    }

    thisBooking.dom.wrapper.addEventListener('updated',function() {
      thisBooking.updateDOM();
    });

    thisBooking.dom.submit.addEventListener('click', function(){
      event.preventDefault();

      if (!thisBooking.choosenTable){
        alert('Choose a table, please!');
        return;
      }

      if (thisBooking.dom.phone.value == '' && thisBooking.dom.address.value == ''){
        alert('Enter your phone and address, please!');
        return;
      }

      thisBooking.sendBooking();
    });
    
  }

  getData(){
    const thisBooking = this;

    const startEndDates = {};
    startEndDates[settings.db.dateStartParamKey] = utils.dateToStr(thisBooking.datePicker.minDate);
    startEndDates[settings.db.dateEndParamKey] = utils.dateToStr(thisBooking.datePicker.maxDate);

    const endDate = {};
    endDate[settings.db.dateEndParamKey] = startEndDates[settings.db.dateEndParamKey];

    const params = {
     
      booking: utils.queryParams(startEndDates),
      eventsCurrent: settings.db.notRepeatParam + '&' + utils.queryParams(startEndDates),
      eventsRepeat: settings.db.repeatParam + '&' + utils.queryParams(endDate),
    };
    //console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
    };
    
    //console.log('getData urls', urls);

    Promise.all([ 
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]){
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      
      });
  }

  
  parseData(bookings, eventsCurrent, eventsRepeat){ 
    const thisBooking = this; 
    thisBooking.booked = {}; 

    for (let eventBooking of eventsCurrent) { 
      //console.log(eventBooking);
      thisBooking.makeBooked(eventBooking.date, eventBooking.hour, eventBooking.duration, eventBooking.table); 
    }

    for (let event of bookings) { //ok
      //console.log(eventBooking);
      thisBooking.makeBooked(event.date, event.hour, event.duration, event.table); 
      //console.log(bookings);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let reapetEvent of eventsRepeat){ 
      if(reapetEvent.repeat == 'daily'){ 
        for (let dateDaily = minDate; dateDaily <= maxDate; dateDaily = utils.addDays(dateDaily, 1)){  
          thisBooking.makeBooked(utils.dateToStr(dateDaily), reapetEvent.hour, reapetEvent.duration, reapetEvent.table); 
          //console.log(reapetEvent);
        }
      }
    }
  
    thisBooking.updateDOM();
    thisBooking.rangeSlider();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    

    if (!thisBooking.booked[date]){ 
      thisBooking.booked[date] = {}; 
    }
    const bookedHour = utils.hourToNumber(hour);
    //console.log(hour);

    for (let blockHour = bookedHour; blockHour < bookedHour + duration; blockHour += 0.5) { 
    
      if (!thisBooking.booked[date][blockHour]){
        thisBooking.booked[date][blockHour] = []; 
      }
      // if (thisBooking.booked[date][blockHour].indexOf(table) == -1) {
      thisBooking.booked[date][blockHour].push(table); 
      
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    //console.log('Booking.date:', thisBooking.date);
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    
    thisBooking.choosenTable = null;

    for(let table of thisBooking.dom.tables){ 
      let numberTable = table.getAttribute(settings.booking.tableIdAttribute); 
      numberTable = parseInt(numberTable); 
    
      table.classList.remove(classNames.booking.tableSelected);
    
      if (thisBooking.booked[thisBooking.date] && 
      thisBooking.booked[thisBooking.date][thisBooking.hour] && 
      thisBooking.booked[thisBooking.date][thisBooking.hour].includes(numberTable)){
        table.classList.add(classNames.booking.tableBooked); 
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
      
    }
    thisBooking.rangeSlider();
  }

  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const bookingPayload = {
      date: thisBooking.date,
      hour: utils.numberToHour(thisBooking.hour), 
      table: thisBooking.choosenTable, 
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
      starters: [],
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) { 
        const starterValue = starter.value;
        bookingPayload.starters.push(starterValue);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingPayload),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      })
      .then(function(parsedResponse){
        console.log('parsedResponse', parsedResponse);
        thisBooking.makeBooked(bookingPayload.date, bookingPayload.hour, bookingPayload.duration, bookingPayload.table);
        thisBooking.updateDOM();
       
        alert('DONE'); 
      });
   
  }

  rangeSlider(){
    const thisBooking = this;
    const bookedRange = thisBooking.booked[thisBooking.date];
  
    const colors = [];


    const rangeSlider  = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.rangeSlider);
    

    for (let bookedTime in bookedRange) {
      
      const min = 12;
      const max = 24;
      const step = 0.5;
      const startValue = (((bookedTime - min) * 100) / (max - min)); 
     
      const endValue = (((bookedTime - min) + step ) * 100) / (max - min);  
    

      if (bookedTime < max) {

        if (bookedRange[bookedTime].length <=  1 ) {
          console.log(bookedTime);
          colors.push ('/*' + bookedTime + '*/green ' + startValue + '%, green ' + endValue + '%');
          console.log('bookedTime1',bookedTime);
        } else if (bookedRange[bookedTime].length === 2) {
          colors.push ('/*' + bookedTime + '*/orange ' + startValue + '%, orange ' + endValue + '%');
          console.log('bookedTime2',bookedTime);
        } else if (bookedRange[bookedTime].length === 3) {
          colors.push ('/*' + bookedTime + '*/red ' + startValue + '%, red ' + endValue + '%'); 
          console.log('bookedTime3',bookedTime);
        }
      }
    }
    
    colors.sort();
    const pushedColors = colors.join();
    rangeSlider.style.background = 'linear-gradient(to right, ' + pushedColors + ')';
  }
}