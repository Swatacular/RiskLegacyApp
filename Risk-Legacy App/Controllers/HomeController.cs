using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Risk_Legacy_App.Models;



namespace Risk_Legacy_App.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            var myModel = new Setting();
            myModel.diceList.Add(new Die());
            foreach (Die item in myModel.diceList)
            {
                item.RollAndAdjust();
                item.attacker = true;
            }
            return View(myModel);
        }
        public ActionResult Index(Die myDie)
        {
            var myModel = new Setting();
            myModel.diceList.Add(new Die());
            foreach (Die item in myModel.diceList)
            {
                item.RollAndAdjust();
                item.attacker = true;
            }
            return View(myModel);
        }
    }
}