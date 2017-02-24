using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Risk_Legacy_App.Models
{
    public class Setting
    {

        public int MyNumber { get; set; }
        public string MyString { get; set; }
        public int MyNumberTwo { get; set; }
        public string MyStringTwo { get; set; }

        public Setting()
        {
            MyNumber = 1337; //At the present moment MyNumber is used for the default value of the "Rolls" box.. if you navigate to Views/Home/Index on line 37 you can see @Model.MyNumber, You can put any property from the "setting" class anywhere on the other page by using the @ symbol
            MyString = "Yo, as it is currently set, the \"MyString\" property inside the Setting class is output here in the middle column.";
        }
    }
}