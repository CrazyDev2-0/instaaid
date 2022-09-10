import React, {useState, useEffect} from 'react'
import { Link } from "react-router-dom";
import "./stylesMap.css";
import arrow_r from "./charm_arrow-right.png";
import location_marker from "./location_marker.png";

import {useNavigate} from "react-router-dom"

function Home() {
  const navigate = useNavigate();


  const requestLocationAccess = async()=>{
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos)=>{
        navigate("/map");
      }, ()=>{});
    };
  }



  return (
    <>
      <div className="first_page_con">
        <img src={location_marker} />
        <p>We need to access the location of your device to help you find the nearest vending machine</p>
      </div>

      <div className="bottomBar">
        <div className="btn" onClick={()=>requestLocationAccess()}>Allow Location Permission
          <img src={arrow_r}></img>
        </div>
      </div>
    </>
  )
}

export default Home