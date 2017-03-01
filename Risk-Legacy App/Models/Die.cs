using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;


namespace Risk_Legacy_App.Models
{
    public class Die
    {
        public static Random randy = new Random();

        public int rangeMin;
        public int rangeMax;
        public int currentNumber; //whatever was rolled (only used for autorolling)
        public int adjuster;
        public int adjustedNumber;
        public bool attacker;
        
        public Die()
        {
            rangeMin = 1;
            rangeMax = 6;
            adjuster = 0;
        }

        public void RollAndAdjust()
        {
            Roll();
            Adjust();
        }
        public void Roll()
        {
            currentNumber = randy.Next(rangeMin, rangeMax);
        }
        public void Adjust()
        {
            adjustedNumber = currentNumber + adjuster;
        }
    }
}