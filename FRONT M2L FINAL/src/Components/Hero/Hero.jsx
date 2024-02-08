import React from 'react'
import './Hero.css'
import hand_icon from '../Assets/hand_icon.png'
import arrow_icon from '../Assets/arrow.png'
import hero_image from '../Assets/hero_image.png'


const Hero = () => {
  return (
    <div className='hero'>
        <div className="hero-left">
            <div>
                <div className="hero-hand-icon">
                    <p>Bienvenue</p>
                    <img src={hand_icon} alt="" />
                </div>
                <p>sur le site de</p>
                <p>La Maison des Ligues</p>
            </div>
           <div className="hero-latest-btn">
                <div>Nouveautés</div>
                <img src={arrow_icon} alt="" />
           </div>
        </div>

        <div className="hero-right">
            <img src={hero_image} alt="" />

        </div>
    </div>
  )
}

export default Hero