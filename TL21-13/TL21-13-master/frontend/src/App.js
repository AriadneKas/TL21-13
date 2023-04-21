import React, { useState } from "react";
import moment from 'moment'
import { passesCost } from './api';
import Calendar from 'react-calendar';
import styled from 'styled-components';
import './App.css';
import './Calendar.css';

//Style for select button
const Select = styled.select`
  background-color: #4fc3f7;
  color: white;
  padding: 5px 15px;
  border-radius: 5px;
  outline: 0;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0px 2px 2px lightgray;
  transition: ease background-color 250ms;
  &:hover {
    background-color: #0091ea;
  }
`

//Style for Submit button
const Button = styled.button`
  background-color: #b71c1c;
  color: white;
  padding: 5px 15px;
  border-radius: 5px;
  outline: 0;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0px 2px 2px lightgray;
  transition: ease background-color 250ms;
  &:hover {
    background-color: #d50000;
  }
`

function App() {
  //Important note: useState works asynchronous, so when we setValue something, if we use that value immediately
  //it may or may not have the new value and in that case, we'll need to handle that problem. That can be handled
  //by using componentDidMount(), useTimeout, or the callback method of setState, if we work with setState.

    //compname has the name of our company and compname2 the value of the company that we view debt information
    const [compname, setCompname] = useState('');
    const [compname2, setCompname2] = useState('');

    //dateState has the date from and dateState2 has the date to
    const [dateState, setDateState] = useState(new Date())

    //handle onClickDay from the 1st calendar 
    const changeDate = (e) => {
      setDateState(e)
    }
    const [dateState2, setDateState2] = useState(new Date())

    //handle onClickDay from the 2nd calendar
    const changeDate2 = (e) => {
      setDateState2(e)
    }

    //Format the date to a value that is acceptable from our api
    const dateFrom = moment(dateState).format('YYYY-MM-DD hh:mm:ss')
    const dateTo = moment(dateState2).format('YYYY-MM-DD hh:mm:ss')

    //This is the url endpoint that is going to be sent to passesCost in ./api
    //  :op1_ID/:op2_ID/:date_from/:date_to
    const wholeUrl = compname + '/' + compname2 + '/' + dateFrom + '/' + dateTo;

    //answer contains the string that is going to be displayed at the end
    const [answer, setAnswer] = React.useState('');

    //boolean value that checks if submit button was pressed
    const [submit, setSubmit] = React.useState(0)
    
    //If submit was pressed change its value to 1 (true)
    const changeSubmit = () => {
      setSubmit(1);
    }
    //GET method that returns PassesCost endpoint from api
    if (submit) {
      setSubmit(0);

      //If submit was pressed but no value was selected in one of the selects, then do nothing
      if (compname !== '' && compname2 !== '') {
        if (compname === compname2) setAnswer(compname2+" ows you an amount of 0 for the selected period (You can't owe yourself!)")

        //passesCost returns a GET method and its handled by using .then(...)
        //axios returns a "Promise" that has a property called data, that contains the information that the GET method returned in an array
        //In our case, the array has a json object in position 0, which has a Sum_Amount index with the information that its needed
        else (passesCost(wholeUrl).then((response) => {
          var temp = (response.data)[0].Sum_Amount;
          const wholeUrl1 = compname2 + '/' + compname + '/' + dateFrom + '/' + dateTo;
          //Get request with opossite comp names to see how much compname ows compname2
          passesCost(wholeUrl1).then((response1) => {
            var temp2 = (response1.data)[0].Sum_Amount;
            if (temp > temp2) {
              var diff = temp - temp2;
              //Keep only 2 decimal digits
              var strDiff = Number(diff).toFixed(2).toString();
              setAnswer(compname2+" ows you an amount of "+strDiff+" for the selected period");
            }
            else {
              var diff = temp2 - temp;
              //Keep only 2 decimal digits
              var strDiff = Number(diff).toFixed(2).toString();
              setAnswer("You owe "+compname2+" an amount of "+strDiff+" for the selected period");
            }
          });
          //setAnswer(compname2+" ows you an amount of "+((response.data)[0]).Sum_Amount+" for the selected period");
        }))
      }
    }

  return (
    
    <div> 
      <b>Please select your company </b>
      <Select onChange={e => e.target.value !== '-' ? setCompname(e.target.value) : setCompname('')}>
        <option value="-">-</option>
        <option value="moreas">moreas</option>
        <option value="aodos">aodos</option>
        <option value = "kentriki_odos">kentriki odos</option>
        <option value = "gefyra">gefyra</option>
        <option value = "olympia_odos">olympia odos</option>
        <option value = "egnatia">egnatia</option>
        <option value = "nea_odos">nea odos</option>
      </Select>
      <br></br>
      <b>Select a company to view debt information </b>
      <Select onChange={k => k.target.value !== '-' ? setCompname2(k.target.value) : setCompname2('')}>
        <option value="-">-</option>
        <option value="moreas">moreas</option>
        <option value="aodos">aodos</option>
        <option value = "kentriki_odos">kentriki odos</option>
        <option value = "gefyra">gefyra</option>
        <option value = "olympia_odos">olympia odos</option>
        <option value = "egnatia">egnatia</option>
        <option value = "nea_odos">nea odos</option>
      </Select>
      <br></br>
      <br></br>
      <b>Select Date From</b>
      <Calendar onClickDay={changeDate}/> 
      <br></br>
      <b>Select Date To</b>
      <Calendar onClickDay={changeDate2}/> 
      <Button onClick= {changeSubmit} >Submit</Button>
      <br></br>
      <h3>{answer}</h3>
    </div>
  );
}

export default App;