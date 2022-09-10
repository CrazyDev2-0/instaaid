import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "./stylesMap.css";
import axios from 'axios';
import arrow_r from "./charm_arrow-right.png";

mapboxgl.accessToken =
  "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA";
  
const Map = () => {
  const mapContainerRef = useRef({});
  const map = useRef(null);
  const dataRef = useRef({
    "lat" : 0,
    "lon"  : 0
  });
  const defMach = {address : "", code : "", id : 0, latitude : 0, longitude : 0, productsCount : 0, selected: false};
  const [mach, setMach] = useState(defMach);

  const currLocation = async() =>{
    if (navigator.geolocation) {
      var position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      dataRef.current = {
        "lat" : position.coords.latitude,
        "lon"  : position.coords.longitude
      }

    }
  }

  const url = 'https://instaaidapi.tanmoy.codes/';

  const machposapi = async () =>  {
    const data = await axios({
      method: 'get',
      url: `${url}machines?lat=${dataRef.current.lat}&lon=${dataRef.current.lon}`
    });
    await Promise.all((data.data.payload).map( async (point) => {    
      const marker = new mapboxgl.Marker({color: "#000000"});
      marker.setLngLat([point.longitude, point.latitude]);
      const element = marker.getElement();
      element.addEventListener('click', () => {
        setMach({address: point.address, code: point.code, id: point.id,  productsCount : point.productsCount, selected: true});
      })
      marker.addTo(map.current);
    }));
  }


  // Initialize map when component mounts
  useEffect(() => {
    async function init(){
      await currLocation();
      map.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v9",
        center: [dataRef.current.lon, dataRef.current.lat],
        zoom: 9,
      });

      // Create default markers
      new mapboxgl.Marker().setLngLat([dataRef.current.lon, dataRef.current.lat]).addTo(map.current);
      await machposapi();

      // Add navigation control (the +/- zoom buttons)
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Clean up on unmount
      return () => map.current.remove();
    }
    init();
  }, []);

  const [quant, setQuant] = useState(1);
  const [type, setType] = useState("");
  const payapi = async () =>  {
    try {
      const res = await axios({
        method: 'post',
        url: `${url}order`,
        data:{
          "quantity" : quant,
          "machine_id" : mach.code,        
          "product" : type
        }
      });
      const redlink = res.data.payload.link;
      window.location.href = redlink;
    } catch (error) {
      alert(error.response.data.message);
    }
  }  
  
  return (
    <div>
        <div className="map-container" ref={mapContainerRef}></div>
        {
         mach.selected ?
            <div>
              <div className="bottomBar">
                <p className="address">{mach.address}</p>
                <button className={type === "sanitary_pad" ? "quantity active" : "quantity"} id="sanitary_pad" value={type} onClick={() => setType("sanitary_pad")}>SANITARY PAD &nbsp;&nbsp;&nbsp; 10/pc</button>
                <button className={type === "condom" ? "quantity active" : "quantity"} id="condom" value={type} onClick={() => setType("condom")}>CONDOM &nbsp;&nbsp;&nbsp;5/pc</button>
                <input type="number" style={{ display : type ? 'block' : 'none'}}className="quantity" placeholder="Quantity... " value={quant} onChange={(e) => setQuant(e.target.value )}></input>  
                <div className="btn" onClick={payapi}>
                  Buy Now
                  <img src={arrow_r}></img>
                </div>
              </div>
            </div> : 
          <div className="bottomBar">
            <div className="btn">
              Select Location to buy
              <img src={arrow_r}></img>
            </div>
          </div>
        }
    </div>
  );
};

export default Map;