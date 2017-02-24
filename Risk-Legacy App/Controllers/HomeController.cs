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
            return View(myModel);
        }
    }
}