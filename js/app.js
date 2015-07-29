$(function () {
  $.support.cors = true;
  // enhance Date obj
  Date.prototype.formatString = function (format) {
    var output, monthTxt = ['Jan', 'Feb', 'Mar', 'Apr', 'may', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        y = this.getFullYear(),
        m = this.getMonth() + 1,
        d = this.getDate();
    if (d < 10) { d = '0' + d }
    if (m < 10) { m = '0' + m }
    format !== "undefined" ?
      output = format.replace(/yyyy/, y).replace(/mm/, m).replace(/dd/, d).replace(/month/, monthTxt[this.getMonth()]) :
    output = this.toString();
    return output;
  }
  Date.prototype.to12h = function () {
    var hr = this.getHours(),
        min = this.getMinutes(),
        meridiem = hr < 12 ? "AM" : "PM";

    if (hr > 12) {
      hr -= 12;
    }
    (hr < 10) ? hr = '0' + hr : hr = hr.toString();
    (min < 10) ? min = '0' + min : min = min.toString();

    return hr + ':' + min + ' ' + meridiem;
  }
  Date.prototype.convertTimeZone = function (offset) {
    var distination = this.getTime() + this.getTimezoneOffset() * 60000 + offset * 3600000;
    this.setTime(distination);
    return this;
  }
  Date.prototype.toServerTime = function () {
    function isDst() {
      var today = new Date(),
          jan = new Date(today.getFullYear(), 0, 1),
          jul = new Date(today.getFullYear(), 6, 1);
      return today.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    };

    // change to pacific time
    this.convertTimeZone(isDst() ? -7 : -8);
    var output = this.formatString('mm/dd/yyyy') + ' ' + this.to12h();
    return output;
  }

  // hack
  function req_time_rand(){
    return parseInt(Math.random()*1000);
  }
  function to_invoice(invoice){
    var iv = $.extend({
      items:[],
      subtotal:0,
      tax_percent:9.25,
      tax_amount:0,
      discount_percent:0,
      discount_amount:0,
      tip_amount:0,
      total:0,
      payment_type:"",
      card_type:"",
      card_last_number:"",
    },invoice);
    var subtotal = 0;
    var dis = 0;
    var dis_amt = 0;
    var tax_amt = 0;
    iv.items.forEach(function(i){
      subtotal += i.amount * i.quantity;
      dis = utility.evenRound(i.amount * i.quantity * iv.discount_percent/100);
      dis_amt += dis;
      tax_amt += utility.evenRound((i.amount * i.quantity - dis) * iv.tax_percent / 100, 2);
    });
    iv.subtotal = utility.evenRound(subtotal, 2);
    iv.discount_amount = dis_amt;
    iv.tax_amount = tax_amt;
    iv.total = utility.evenRound(iv.subtotal - iv.discount_amount + iv.tax_amount + iv.tip_amount, 2);
    return iv;
  }
  function alert_demo(){
    alert("THIS IS NOT WORKING IN THE DEMO");
  }
  var m_id = 1234;
  
  // CONSTS
  var LOGIN_EXPIRE_PERIOD = 86400000,
      ONLINE_AUTOLOAD_PERIOD = 90000,
      CLICKEVENT = "click",
      DOMAIN = "www.dgbid.com";

  var data = {
    device_id: "",
    dgbid_id: "",
    site_id: "",
    site_url: "",
    op_mode: "",
    tax: ""
  },
      utility = {
        getTimeStamp: function () {
          return "?tmstmp=" + (new Date()).getTime();
        },
        setInterval: function (time, fn) {
          var handler = null;

          this.start = function () {
            if (fn !== "undefined") {
              handler = setInterval(fn, time);
            }
          }
          this.clear = function () {
            clearInterval(handler);
          }
          this.renew = function () {
            if (handler) {
              this.clear();
              this.start();
            }
          }
          this.start();

          return this
        },
        setTimeout: function (time, fn) {
          var handler = null;

          this.start = function () {
            if (fn !== "undefined") {
              handler = setTimeout(fn, time);
            }
          }
          this.clear = function () {
            clearTimeout(handler);
          }
          this.renew = function () {
            if (handler) {
              this.clear();
              this.start();
            }
          }
          this.start();

          return this
        },
        dateMod: function (d, n) {
          var dn = new Date(d);
          dn.setDate(dn.getDate() + n);
          return dn;
        },
        getTodayPeriod: function () {
          var today = new Date();
          today.setHours(0, 0, 0, 0);
          return {
            start: today,
            end: utility.dateMod(today, 1)
          }
        },
        getPastWeekPeriod: function () {
          var today = new Date();
          today.setHours(0, 0, 0, 0);
          return {
            start: utility.dateMod(today, -6),
            end: utility.dateMod(today, 1)
          }
        },
        getNextWeekPeriod: function () {
          var today = new Date();
          today.setHours(0, 0, 0, 0);
          return {
            start: today,
            end: utility.dateMod(today, +8)
          }
        },
        parseDate: function (date) {
          if (date) {
            return new Date(parseInt(date.match(/Date\((.+)\)/)[1]));
          } else {
            return date;
          }
        },
        hyperLink: function (url) {
          /*
          if (typeof Windows !== "undefined") {
            Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(url));
          } else {
            window.location.href = url;
          }*/
          alert_demo();
        },
        evenRound: function (num, decimalPlaces) {
          var d = decimalPlaces || 0;
          var m = Math.pow(10, d);
          var n = +(d ? num * m : num).toFixed(8); // Avoid rounding errors
          var i = Math.floor(n), f = n - i;
          var r = (f == 0.5) ? ((i % 2 == 0) ? i : i + 1) : Math.round(n);
          return d ? r / m : r;
        }
      },
      sort = {
        ascent: function (key) {
          return function (a, b) {
            var ax = ko.toJS(a),
                bx = ko.toJS(b);
            if (ax[key] < bx[key]) return -1;
            if (ax[key] > bx[key]) return 1;
            return 0;
          }
        },
        descent: function (key) {
          return function (a, b) {
            var ax = ko.toJS(a),
                bx = ko.toJS(b);
            if (ax[key] < bx[key]) return 1;
            if (ax[key] > bx[key]) return -1;
            return 0;
          }
        }
      },
      ajaxCall = {
        processing: false,
        base: {
          _timestamp: 0,
          type: "POST",
          contentType: "application/json",
          dataType: "json",
          timeout: 60000,
          beforeSend: function () {
            ajaxCall.processing = true;
            this._callee = this.url.match(/\/(\w+)\?/)[1];
            this._timestamp = (new Date()).getTime();
          },
          complete: function () {
            ajaxCall.processing = false;
            var service = this.url.match(/\/(\w+)\?/)[1],
                duration = (new Date()).getTime() - this._timestamp;
            console.log("%s: %sms", service, duration);
          }
        },
        doLogin: function (email, password) {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.User);
          },req_time_rand());
          return dfd;
        },
        GetManagerPW: function () {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.Manager_pw);
          },req_time_rand());
          return dfd;
        },
        SetManagerPW: function (password) {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          DUMMY_DATA.password = password;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.Manager_pw);
          },req_time_rand());
          return dfd;
        },
        GetSummary: function (start_date, end_Date) {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.Summary);
          },req_time_rand());
          return dfd;
        },
        GetItemSummaryByCount: function () {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.ItemSummaryByCount);
          },req_time_rand());
          return dfd;
        },
        GetItemSummaryByAmount: function () {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.ItemSummaryByAmount);
          },req_time_rand());
          return dfd;
        },
        GetOptions: function () {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.Options);
          },req_time_rand());
          return dfd;
        },
        addOption: function (option_name, option_amount) {
          var dfd = new $.Deferred();
          var postdata = {};
          postdata.option_id = DUMMY_DATA.Options.length + 123;
          postdata.option_name = option_name;
          postdata.option_desc = "";
          postdata.option_amount = option_amount || 0;
          DUMMY_DATA.Options.push(postdata);
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(true);
          },req_time_rand());
          return dfd;
        },
        editOption: function (option_id, option_name, option_amount) {
          var dfd = new $.Deferred();
          var opt = DUMMY_DATA.Options.filter(function(o){
            return o.option_id = option_id;
          })[0];
          opt.option_name = option_name;
          opt.option_amount = option_amount || 0;
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(true);
          },req_time_rand());
          return dfd;
        },
        deleteOption: function (option_id) {
          var dfd = new $.Deferred();
          DUMMY_DATA.Options = DUMMY_DATA.Options.filter(function(o){
            return o.option_id != option_id;
          });
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(true);
          },req_time_rand());
          return dfd;
        },
        GetOnlineOrders: function (start_date, end_date) {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.OnlineOrders);
          },req_time_rand());
          return dfd;
        },
        GetOrders: function (start_date, end_date) {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.Orders);
          },req_time_rand());
          return dfd;
        },
        GetInvoice: function (order_id) {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.Invoice[order_id]);
          },req_time_rand());
          return dfd;
        },
        GetOrderItem: function (order_id) {
          var dfd = new $.Deferred();
          var postdata = {};
          postdata.order_id = order_id;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.OrderItem[order_id].slice());
          },req_time_rand());
          return dfd;
        },
        CreateManualItem: function () {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(m_id++);
          },req_time_rand());
          return dfd;
        },
        ProcessOnlineOrder: function (order_id, is_confirm) {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(true);
          },req_time_rand());
          return dfd;
        },
        CreateOrder: function (table_number, name, itemlist) {
          var dfd = new $.Deferred();
          var order = {};
          order.table_number = table_number.toLowerCase();

          var order = {
            order_id: DUMMY_DATA.Orders.length + 2001,
            reserve_type:"None",
            scheduled_date: new Date(),
            group_size:1,
            special_request:"",
            table_number:table_number.toLowerCase(),
            reservation_name:"",
            staff_name:"",
            phone_number:"",
            email_address:"",
            payment_ref_id:"",
            payment_type:"",
            paid_total:0,
            amount:0,
            status:"initiated",
          };

          if (order.table_number == "takeout") {
            order.staff_name = "";
            order.reservation_name = name;
          } else {
            order.staff_name = name;
            order.reservation_name = "";
          }
          DUMMY_DATA.Orders.push(order);
          var items = itemlist.slice();
          DUMMY_DATA.OrderItem[order.order_id] = items;
          var iv = to_invoice({items:items});
          DUMMY_DATA.Invoice[order.order_id] = iv;
          order.amount = iv.total;
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(order);
          },req_time_rand());
          return dfd;
        },
        CheckInOrder: function (order_id, table_number, staff_name) {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(true);
          },req_time_rand());
          return dfd;
        },
        UpdateOrder: function (order_id, table_number, staff_name, itemlist) {
          var dfd = new $.Deferred();
          var order = DUMMY_DATA.Orders.filter(function(o){ return o.order_id = order_id})[0];
          order.table_number = table_number.toLowerCase();
          order.staff_name = staff_name;
          var items = itemlist.slice();
          DUMMY_DATA.OrderItem[order_id] = items;
          DUMMY_DATA.Invoice[order_id] = to_invoice({
            items:items
          });

          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(order);
          },req_time_rand());
          return dfd;
        },
        UpdateOrderAmount: function (order_id, tip_amount, discount_percent) {
          var dfd = new $.Deferred();
          var order = DUMMY_DATA.Orders.filter(function(o){ return o.order_id = order_id})[0];
          var iv = DUMMY_DATA.Invoice[order_id];
          iv.tip_amount = tip_amount;
          iv.discount_percent = discount_percent;
          iv = to_invoice(iv);
          DUMMY_DATA.Invoice[order_id] = iv;
          dfd.resolve(true);
          return dfd;
        },
        SplitOrder: function (order_id, split) {
          var dfd = new $.Deferred();
          dfd.resolve(true);
          return dfd;
        },
        RemoveSplitOrder: function (order_id) {
          var dfd = new $.Deferred();
          dfd.resolve(true);
          return dfd;
        },
        CancelOrder: function (order_id) {
          var dfd = new $.Deferred();
          DUMMY_DATA.Orders = DUMMY_DATA.Orders.filter(function(o){ return o.order_id != order_id});
          dfd.resolve(true);
          return dfd;
        },
        VoidOrder: function (order_id) {
          var dfd = new $.Deferred();
          DUMMY_DATA.Orders = DUMMY_DATA.Orders.filter(function(o){ return o.order_id != order_id});
          dfd.resolve(true);
          return dfd;
        },
        GetCategory: function () {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.Categories);
          },req_time_rand());
          return dfd;
        },
        GetAllItems: function () {
          var dfd = new $.Deferred();
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(DUMMY_DATA.AllItems);
          },req_time_rand());
          return dfd;
        },
        SetCash: function (order_id) {
          var dfd = new $.Deferred();
          var o = DUMMY_DATA.Orders.filter(function(o){ return o.order_id == order_id;})[0];
          o.payment_type = "cash";
          dfd.resolve(true);
          return dfd;
        },
        SetSwipe: function (order_id, track_data) {
          var dfd = new $.Deferred();
          var o = DUMMY_DATA.Orders.filter(function(o){ return o.order_id == order_id;})[0];
          o.payment_type = "credit";
          dfd.resolve(true);
          return dfd;
        },
        SetCredit: function (order_id, card) {
          var dfd = new $.Deferred();
          var o = DUMMY_DATA.Orders.filter(function(o){ return o.order_id == order_id;})[0];
          var iv = DUMMY_DATA.Invoice[order_id];
          iv.card_last_number = card.number.slice(-4);
          iv.card_type = "Visa";
          DUMMY_DATA.Invoice[order_id] = iv;
          o.payment_type = "credit";
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve(true);
          },req_time_rand());
          return dfd;
        },
        SetSignature: function (order_id, signature, email) {
          var dfd = new $.Deferred();
          var o = DUMMY_DATA.Orders.filter(function(o){ return o.order_id == order_id;})[0];
          o.email_address = email;
          dfd.resolve(true);
          return dfd;
        },
        AuthorizePayment: function (order_id) {
          var dfd = new $.Deferred();
          var o = DUMMY_DATA.Orders.filter(function(o){ return o.order_id == order_id;})[0];
          var iv = DUMMY_DATA.Invoice[order_id];
          o.status = "authorized";
          o.payment_ref_id = 123;

          var postdata = {};
          postdata.store_id = data.site_id;
          postdata.order_id = order_id;
          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve('success');
          },req_time_rand());
          return dfd;
        },
        ProcessPayment: function (order_id, tip_amount, discount_percent) {
          var dfd = new $.Deferred();
          var o = DUMMY_DATA.Orders.filter(function(o){ return o.order_id == order_id;})[0];
          var iv = DUMMY_DATA.Invoice[order_id];
          
          iv.tip_amount = tip_amount;
          iv.discount_percent = discount_percent;
          iv = to_invoice(iv);
          DUMMY_DATA.Invoice[order_id] = iv;
          if(!o.payment_ref_id){
            o.payment_type = "cash";
          }
          o.status = "complete";
          o.paid_total = iv.total;
          o.tip_amount = iv.tip_amount;

          ajaxCall.processing = true;
          setTimeout(function(){
            ajaxCall.processing = false;
            dfd.resolve('success');
          },req_time_rand());
          return dfd;
        }
      };

  // MODULE
  function nScroll() {
    var self = this,
        scrolls = [];

    self.add = function (element) {
      var ns = $(element).addClass('nicescroll').niceScroll().hide();
      scrolls.push(ns);
      return self;
    }
    self.resize = function () {
      console.log('resize');
      $.map(scrolls, function (ns) {
        ns.resize();
      });
      return self;
    }
  }
  function Printer() {
    var self = this;
    self.printing = false;
    self.setting = {
      ip_address: "",
      kitchen_ip_address: "",
      cut_feed: true,
      kick_drawer: true,
      auto_print: true
    };
    if (!!window.OrengeoPOS) {
      self.client = OrengeoPOS.Runtime.OrengeoClient(data.site_id, DOMAIN);
      self.setPrinter = function (cashier, kitchen, cutpaper, kickdrawer, autoprint) {
        var dfd = new $.Deferred();
        self.client.setPrinter(cashier, kitchen, cutpaper.toString(), kickdrawer.toString(), autoprint.toString()).then(
          function (r) {
            if (!!r) {
              self.setting = $.parseJSON(r);
            }
            dfd.resolve(self.setting);
          },
          function () { dfd.reject(); }
        );
        return dfd;
      }
      self.printOrder = function (order_id, dont_kick, force_print) {
        var dfd = new $.Deferred();
        if (!self.printing) {
          self.client.printOrder(order_id, dont_kick || false, force_print || false).then(function (msg) {
            self.printing = false;
            dfd.resolve(msg);
          }, function () { dfd.reject(); });

          // in case printing is going wrong
          setTimeout(function () {
            self.printing = false;
          }, 3000);
        }
        return dfd
      }
      self.openDrawer = function () { return self.client.openDrawer(); }
      self.getDeviceId = function () { return self.client.getDeviceId(); }
      self.init = function () {
        var dfd = new $.Deferred();
        self.client.initPinter().then(
          function (r) {
            if (!!r) {
              self.setting = $.parseJSON(r);
            }
            dfd.resolve(self.setting);
          },
          function () { dfd.reject(); }
        );
        return dfd;
      }
    } else {
      // dummy
      self.setPrinter = function (cashier, kitchen, cutpaper, kickdrawer, autoprint) {
        self.setting.ip_address = cashier;
        self.setting.kitchen_ip_address = kitchen;
        self.setting.cut_feed = cutpaper;
        self.setting.kick_drawer = kickdrawer;
        self.setting.auto_print = autoprint;

        var dfd = new $.Deferred();
        dfd.resolve($.toJSON(self.setting));
        return dfd;
      }
      self.printOrder = function (order_id, dont_kick, force_print) {
        var dfd = new $.Deferred();
        dfd.resolve("True");
        return dfd;
      }
      self.openDrawer = function () { console.log('drawer open'); }
      self.getDeviceId = function () { return "dummy" }
      self.init = function () {
        var dfd = new $.Deferred();
        dfd.resolve($.toJSON(self.setting));
        return dfd;
      }
    }
    // init when construct instance
    self.init();
  }
  function CardReader() {
    var cardRegex = /\%B.+\?/,
        dfd = null,
        buffer = "";

    function reset() {
      dfd = null;
      buffer = "";
      $(document).unbind('.cardread');
    }
    function start() {
      reset();
      dfd = new $.Deferred();
      var last_pressed_time = 0;
      $(document).bind('keypress.cardread', function (e) {
        var this_pressed_time = (new Date).getTime();
        if (this_pressed_time - last_pressed_time > 1000) {
          last_pressed_time = (new Date).getTime();
          buffer = "";
        }

        if (e.which !== 13) {
          buffer += String.fromCharCode(e.which);
        } else {
          if (cardRegex.test(buffer)) {
            dfd.resolve(buffer);
          } else {
            buffer = "";
          }

        }
      });
      return dfd;
    }

    this.reset = reset;
    this.start = start;
  }
  function CreditCard() {
    var self = this;
    self.number = ko.observable("");
    self.year = ko.observable();
    self.month = ko.observable();
    self.cvv2 = ko.observable("");
    self.name = ko.observable("");
    self.error = ko.observable();
    self.monthOption = ko.observableArray([
      { name: 'Jan', val: '01' }, { name: 'Feb', val: '02' }, { name: 'Mar', val: '03' },
      { name: 'Apr', val: '04' }, { name: 'May', val: '05' }, { name: 'Jun', val: '06' },
      { name: 'Jul', val: '07' }, { name: 'Aug', val: '08' }, { name: 'Sep', val: '09' },
      { name: 'Oct', val: '10' }, { name: 'Nov', val: '11' }, { name: 'Dec', val: '12' }
    ]);
    var y = new Date().getFullYear(), i, yrs = [];
    for (i = y; i < y + 10; i++) {
      yrs.push({ name: i.toString(), val: i.toString().slice(-2) });
    }
    self.yearOption = ko.observableArray(yrs);
    self.expireDate = ko.computed(function () {
      if (!!self.month() && !!self.year())
        return self.month().val + self.year().val;
    });
    self.error.subscribe(function () {
      setTimeout(function () { self.error(null); }, 2000);
    });
    self.clear = function () {
      self.number(null);
      self.year(null);
      self.month(null);
      self.cvv2(null);
      self.name(null);
    }
    self.validate = function () {
      var err = null,
          pass = false;
      if (!self.number()) {
        err = "Card # required";
      } else if (!self.month() || !self.year()) {
        err = "Expired Date required"
      } else if (!self.cvv2()) {
        err = "CVV2 required";
      } else {
        pass = true;
      }
      self.error(err);
      return pass;
    }
  }
  function SplitBill(total, dfd) {
    var self = this;
    _minAmount = 5;
    self.total = ko.observable(total || 0);
    self.maxSplits = ko.computed(function () {
      return parseInt(self.total() / _minAmount);
    });
    self.denominator = ko.observable(2);
    self.denominatorInput = ko.computed({
      read: function () {
        return self.denominator();
      },
      write: function (val) {
        if (val < self.maxSplits()) {
          val > 2 ?
            self.denominator(val) :
          self.denominator(2);
        } else {
          self.denominator(self.maxSplits());
        }
      }
    });
    self.denominator.subscribe(function () {
      var amount = utility.evenRound(self.total() / self.denominator(), 2),
          array = [],
          i;
      for (i = 1; i < self.denominator() ; i++) {
        array.push(ko.observable(amount));
      }
      self.splits(array);
    });
    self.splits = ko.observableArray([]);
    self.subtotal = ko.computed(function () {
      var subtotal = 0;
      $.map(self.splits(), function (val) {
        subtotal += parseFloat(val())
      });
      return utility.evenRound(subtotal, 2);
    });
    self.last = ko.computed(function () {
      var subtotal = 0;
      $.map(self.splits(), function (val) {
        subtotal += parseFloat(val())
      });
      return utility.evenRound(self.total() - self.subtotal(), 2);
    });
    self.error = ko.observable("");
    // methods
    self.splitClicked = function () {
      var array = ko.toJS(self.splits);
      array.push(self.last());
      dfd.resolve(array.join(','));
    };
    self.init = function (element) {
      var $ele = $(element[1]).parent();
      self.denominator.valueHasMutated();
      // jquery 
      $ele.on('change', '.splits input', function () {
        var context = ko.contextFor(this),
            index = context.$index(),
            parent = context.$parent,
            prev = parent.splits()[index],
            prevSub = parent.subtotal(),
            total = parent.total(),
            newSub = prevSub - prev() + utility.evenRound(parseFloat(this.value), 2);
        self.error("");
        if (this.value < _minAmount) {
          context.$data = _minAmount;
          this.value = _minAmount;
          self.error("* Minimum $5.00 per bill");
        } else if (newSub > total - _minAmount) {
          context.$data = utility.evenRound(total - prevSub + parseFloat(prev()) - _minAmount, 2);
          this.value = context.$data;
          self.error("* Minimum $5.00 per bill");
        }
        prev(context.$data);
      });
      $ele.on('focus click', 'input[type="number"]', function (e) {
        var self = this;
        setTimeout(function () { self.select(); }, 20);
      });
    }
  }
  // COMPONENT
  function Dropdown(options) {
    var self = this;
    self.index = ko.observable(0);
    self.options = ko.observableArray(options || []);
    self.selected = ko.computed(function () {
      if (self.options().length) {
        return self.options()[self.index()];
      } else {
        return null;
      }
    });
    self.value = ko.computed({
      read: function () {
        if (!!self.selected()) {
          return self.selected().val;
        } else {
          return null;
        }
      },
      write: function (value) {
        $.each(self.options(), function (i, op) { if (op.val == value) { self.index(i); } });
      }
    });
    self.load = function (options, idx) {
      self.options(options || []);
      if (!!idx && idx < self.opitons().length) {
        self.index(idx);
      } else {
        self.index(0);
      }

    }
    // jquery
    self.init = function (element) {
      var $ele = $(element[1]).parent();
      $ele.on(CLICKEVENT, '.options > .option', function () {
        self.index($(this).index());
        if (!!self.changed) {
          setTimeout(self.changed, 50);
        }
      });
      $ele.bind(CLICKEVENT, function (e) {
        $ele.toggleClass('expand');
        e.stopPropagation();
      });
      $('body').bind(CLICKEVENT, function () {
        $ele.removeClass('expand');
      });

      self.show = function () {
        $ele.show();
      }
      self.hide = function () {
        $ele.hide();
      }

      self.options.subscribe(function (opts) {
        opts.length ? self.show() : self.hide();
      });
    }
  }
  function Pagination(items, itemsPerPage, pagersPerPage) {
    var self = this;
    self._itemsBase = ko.observableArray(items);
    self.perPage = ko.observable(itemsPerPage);
    self.perPager = ko.observable(pagersPerPage);
    self.index = ko.observable(1);
    self.maxAmount = ko.computed(function () {
      return self._itemsBase().length
    });
    self.maxPage = ko.computed(function () {
      return Math.ceil(self.maxAmount() / self.perPage())
    });
    self.pagers = ko.computed(function () {
      var median = parseInt(self.perPager() / 2),
          start = 1,
          end = self.maxPage(),
          sequence = [];

      if (self.maxPage() > self.perPager()) {
        if (self.index() <= median) {
          end = self.perPager();
        } else if (self.index() >= self.maxPage() - median) {
          start = self.maxPage() - self.perPager() + 1;
        } else {
          start = self.index() - median;
          end = self.index() + median;
        }
      }
      for (var i = start; i <= end; i++) {
        sequence.push(i);
      }
      return sequence;
    });
    self.items = ko.computed(function () {
      var start = (self.index() - 1) * self.perPage(),
          end = self.index() * self.perPage();
      if (end > self.maxAmount()) {
        end = self.maxAmount();
      };
      return self._itemsBase().slice(start, end);
    });

    //methods
    self.goto = function (i) {
      if (i < 1) {
        self.index(1);
      } else if (i > self.maxPage()) {
        self.index(self.maxPage());
      } else {
        self.index(i);
      }
    }
    self.last = function () {
      self.index(self.maxPage());
    }
    self.next = function () {
      self.goto(self.index() + 1);
    }
    self.prev = function () {
      self.goto(self.index() - 1);
    }
    self.pagerClick = function () {
      self.goto(this)
    };
    self.reload = function (items) {
      self._itemsBase(items);
      self.index(1);
    }

    var counter = 1;
  }
  // WIDGET
  function Category(app) {
    var self = this,
        nscroll = new nScroll();
    self.cates = ko.observableArray();
    //method
    self.load = function () {
      var dfd = ajaxCall.GetCategory().done(function (cates) {
        var lastleaf = [];
        function isLast(node) {
          if (!node.sub) {
            lastleaf.push(node);
          } else {
            $.map(node.sub, function (n) {
              isLast(n);
            });
          }
        }
        $.map(cates, function (n) {
          isLast(n);
        });
        self.cates(lastleaf);
      });
      return dfd;
    }
    self.init = function (element) {
      var $ele = $(element[1]).parent();
      //nscroll
      //nscroll.add($ele);
      //self.cates.subscribe(function () {
      //    nscroll.resize();
      //});
      $ele.on(CLICKEVENT, 'li, .allitems', function () {
        $ele.find('.selected').removeClass('selected');
        $(this).addClass('selected');
        $(this).hasClass('allitems') ? app.menu.filter() : app.menu.filter(ko.dataFor(this).mid);
      });
    }
  }
  function Menu(app) {
    var self = this, $ele;
    self.pagination = new Pagination([], 15, 7);
    self._allitems = null;
    //method
    self.filter = function (cid) {
      var items;
      if (typeof cid == "undefined") {
        items = self._allitems;
      } else {
        items = $.grep(self._allitems, function (i) { return i.category_id == cid });
      }
      self.pagination.reload(items);
    }
    self.init = function (element) {
      $ele = $(element[1]).parent();

      //tweakPage
      function tweakPage() {
        var $items = $ele.find('.items'),
            $item = $ele.find('.item'),
            x_qty = parseInt($items.width() / $item.outerWidth(true)),
            y_qty = parseInt($items.height() / $item.outerHeight(true)),
            page = x_qty * y_qty;

        if (page > 0 && self.pagination.perPage() !== page) {
          self.pagination.perPage(page);
        }
      }
      $(window).bind('resize', tweakPage);
      //$(window).resize(tweakPage);

      self.load = function () {
        var dfd = ajaxCall.GetAllItems().done(function (items) {
          // add click event
          $.map(items, function (item) {
            item.clicked = function () {
              app.invoice.addItem(this);
            }
          });
          self._allitems = (items);
          self.pagination.reload(self._allitems);
          dfd.resolve(true);
          setTimeout(tweakPage, 100);
        });
        return dfd;
      }
    }
  }
  function Option(app) {
    var self = this,
        edit_action = "";
    self.tags = ko.observableArray([]);
    self.tagsPagination = new Pagination([], 15, 5);
    self.ref = {};
    self.mode = ko.observable('add'); // add edit
    self.editing = ko.observable(false);
    self.quickedit_txt = ko.computed(function () { return self.editing() ? 'Finish' : 'Quick Edit'; });
    self.input = ko.observable();
    self.price = ko.observable();
    self.selectedTag = ko.observable();
    self.mode.subscribe(function (mode) {
      if (mode == 'edit') {
        self.editing(true);
      } else {
        self.editing(false);
      }
    });
    self.selectedTag.subscribe(function (tag) {
      !!tag.option_name ?
        self.input(tag.option_name) :
      self.input("");

      !!tag.option_amount ?
        self.price(tag.option_amount) :
      self.price("");
    });
    self.tags.subscribe(function (tags) {
      $.map(tags, function (t) {
        self.ref[t.option_id] = t;
      });
      var idx = self.tagsPagination.index();
      self.tagsPagination.reload(tags);
      if (edit_action == 'add') {
        self.tagsPagination.last();
      } else if (edit_action == 'remove') {
        self.tagsPagination.goto(idx);
      }
    });
    // event
    self.addTag = function () {
      if (!ajaxCall.processing && !!self.input()) {
        var price = parseFloat(self.price()) || 0;
        ajaxCall.addOption(self.input(), price).done(function () {
          self.load('add');
        });
      }
    }
    self.delTag = function (id) {
      if (!ajaxCall.processing) {
        ajaxCall.deleteOption(id).done(function () {
          self.load('remove');
        });
      }
    }
    self.editTag = function () {
      var text = self.input(), price = parseFloat(self.price()) || 0, tag = self.selectedTag();
      if (!ajaxCall.processing && !!text && !!tag) {
        ajaxCall.editOption(tag.option_id, text, price).done(function () {
          self.load();
        });
      }
    }
    self.editClicked = function () {
      self.editing(!self.editing());
    }
    // method
    self.load = function (action) {
      !!action ? edit_action = action : edit_action = "";
      return ajaxCall.GetOptions().then(function (tags) {
        self.tags(tags);
        self.selectedTag("");
        self.input("");
        self.price("");
        return tags;
      });
    };
    self.init = function (element) {
      var $ele = $(element[1]).parent();

      $ele.find('.list ul').on(CLICKEVENT, 'li', function (e) {
        if (self.editing()) {
          if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            self.selectedTag("");
          } else {
            $(this).addClass('selected').siblings().removeClass('selected');
            self.selectedTag(ko.dataFor(this));
          }
        }
      }).on(CLICKEVENT, '.remove', function (e) {
        var $parent = $(this).parents('li'),
            parentElement = $parent.get(0);
        if (!ajaxCall.processing) {
          $(this).parents('li').fadeOut(200, function () {
            self.delTag(ko.dataFor(parentElement).option_id);
          });
        }
      });

      $ele.find('.list ul,.editarea').bind(CLICKEVENT, function (e) { e.stopPropagation(); });
      $ele.parent().bind(CLICKEVENT, function (e) {
        $ele.find('.selected').removeClass('selected');
        self.selectedTag("");
      });
    }
  }
  function Orders(app, isManual) {
    var self = this,
        nscroll = new nScroll();

    function Group(title, orders) {
      this.title = title;
      this.orders = ko.computed(function () {
        return $.grep(orders, function (o) {
          var pass = true;

          if (o.status.match(/split|complete/)) {
            if (self.view() !== 'history') { pass = false };
          } else if (!!o.payment_ref_id) {
            if (self.view() !== 'authorized') { pass = false };
          } else {
            if (self.view() !== 'current') { pass = false };
          }
          // payment
          if (!!self.paymentType() && self.view() == 'history') {
            if (self.paymentType() !== o.payment_type) {
              pass = false;
            }
          }
          return pass;
        });
      });
    }
    self.isManual = ko.observable(!!isManual); // manual payment mode
    self.view = ko.observable(); // current,authorized,history
    self.item_tmpl = ko.computed(function () {
      var tmpl;
      if (self.isManual()) {
        tmpl = 'wg_orders_item_manual';
      } else {
        self.view() == 'history' ?
          tmpl = 'wg_orders_item_complete' :
        tmpl = 'wg_orders_item';
      }
      return tmpl
    });
    self.typeSelect = new Dropdown([
      { val: '', css: 'typeall', name: 'All' },
      { val: 'dinein', css: 'dinein', name: 'Dine In' },
      { val: 'takeout', css: 'takeout', name: 'Take Out' }
    ]);
    self.orderType = self.typeSelect.value;
    self.paySelect = new Dropdown([
      { val: '', css: 'payall', name: 'All' },
      { val: 'cash', css: 'cash', name: 'CASH' },
      { val: 'credit', css: 'credit', name: 'CREDIT' }
    ]);
    self.paymentType = self.paySelect.value;
    self.tableNumber = ko.observable();
    self.selected_id = ko.observable();
    self.orderClicked = function () {
      var order = this;
      if (!order.selected()) {
        self.selected_id(order.order_id);
        app.invoice.load(order);
      }
    }

    // orders
    self.orders = ko.observableArray([]);
    self.groupedOrders = ko.computed(function () {
      var gos = {};
      $.map(self.orders(), function (o) {
        if (!!o.table_number) {
          if (!gos[o.table_number]) {
            gos[o.table_number] = [];
          }
          gos[o.table_number].push(o);
        } else if (o.reserve_type == 'Pickup') {
          if (!gos['takeout']) {
            gos['takeout'] = [];
          }
          gos['takeout'].push(o);
        }
      });
      return gos;
    });
    self.groups = ko.computed(function () {
      var gps = [], gpo = {};
      if (self.orderType() == 'dinein') {
        if (!!self.tableNumber()) {
          if (!!self.groupedOrders()[self.tableNumber()]) {
            gpo[self.tableNumber()] = self.groupedOrders()[self.tableNumber()];
          }
        } else {
          gpo = self.groupedOrders();
        }
        $.each(gpo, function (name, orders) {
          if (name !== 'takeout') {
            gps.push(new Group(name.toUpperCase(), orders));
          }
        });
      } else if (self.orderType() == 'takeout') {
        if (!!self.groupedOrders()['takeout']) {
          gps.push(new Group('', self.groupedOrders()['takeout']));
        }
      } else {
        // all
        gps.push(new Group('', self.orders()));
      }
      return gps;
    });
    self.authorizedCount = ko.computed(function () {
      var count = $.grep(self.orders(), function (o) { return !!o.payment_ref_id && !o.status.match(/split|complete/) });;
      return count.length;
    });

    // summary
    self.salesummary = ko.observable();
    self.orders.subscribe(function (orders) {
      var sale = {
        cash: 0,
        credit: 0,
        tips: 0,
        cash_tips: 0,
        credit_tips: 0,
        total: 0
      },
          complete = $.grep(orders, function (o) { return o.status == 'complete' });
      $.map(complete, function (o) {
        if (o.payment_type == "cash") {
          sale.cash += o.paid_total;
          sale.cash_tips += o.tip_amount;
        } else if (o.payment_type == "credit") {
          sale.credit += o.paid_total;
          sale.credit_tips += o.tip_amount;
        }
        sale.tips += o.tip_amount;
        sale.total += o.paid_total;
      });
      self.salesummary(sale);
    });

    // methods
    self.load = function (table_number, order_id) {
      var today = utility.getTodayPeriod();
      app.popup.loading();
      ajaxCall.GetOrders(today.start, today.end).then(
        function (orders) {
          $.map(orders, function (o) {
            if (!o.checkin_date) {
              o.checkin_date = o.scheduled_date;
            }
            if (o.reserve_type == 'Pickup') {
              o.table_number = 'takeout';
            }
            // add event
            o.selected = ko.computed(function () {
              return self.selected_id() == o.order_id;
            });
            o.clicked = self.orderClicked;
          });

          // filter payment only
          var output = $.grep(orders, function (o) {
            return !((o.table_number == 'manual') ^ self.isManual());
          });

          self.orders(output.reverse());
          self.selected_id('');
          self.render(table_number, order_id);

          // hide loading
          app.popup.hide();
          $(window).resize();
        },
        function () {
          app.popup.message('Time out<p>Please try again.</p>', 'fail');
        }
      );
    }
    self.init = function (element) {
      var $ele = $(element[1]).parent();

      //nscroll.add($ele.find('.views'));

      self.render = function (table_number, order_id) {
        self.tableNumber(table_number || "");
        var target = $.grep(self.orders(), function (o) { return o.order_id == order_id });
        if (target.length) {
          // given order_id
          var o = target[0];
          if (o.status.match(/split|complete/)) {
            self.view('history');
            self.orderType('');
            self.paymentType('');
          } else if (!!o.payment_ref_id) {
            self.view('authorized');
            self.orderType('');
          } else {
            self.view('current');
            if (self.isManual()) {
              self.orderType('');
            } else {
              o.table_number.toLowerCase() == "takeout" ? self.orderType('takeout') : self.orderType('dinein');
            }
          }
          o.clicked();
        } else {
          //undefine
          if ($ele.find('.order').length) {
            $ele.find('.order').eq(0).trigger(CLICKEVENT);
          } else {
            app.invoice.load('empty');
            self.selected_id('');
          }
        }

        //nscroll.resize();
      }

      self.paySelect.changed = function () {
        self.render(self.tableNumber());
      };
      self.typeSelect.changed = function () {
        if (self.typeSelect.value() !== 'dinein') {
          self.tableNumber('');
        }
        self.render(self.tableNumber());
      };

      self.paySelect.hide();
      self.view.subscribe(function (v) {
        switch (v) {
          case 'history':
            self.paySelect.show();
            app.tab('history');
            break;
          case 'authorized':
            self.paySelect.hide();
            app.tab('tips');
            break;
          case 'current':
            self.paySelect.hide();
            app.tab('payment');
            break;
        }
      });

      function tweakheight() {
        var $head = $ele.find('.header'),
            $views = $ele.find('.views'),
            $sales = $ele.find('.salesummary'),
            h = $ele.height();

        if ($head.is(':visible')) {
          h -= $head.outerHeight();
        }

        if ($sales.is(':visible')) {
          h -= $sales.outerHeight();
        }

        $views.height(h);
        //nscroll.resize();
      }
      $(window).bind('resize', tweakheight);
      self.view.subscribe(function () {
        setTimeout(tweakheight, 100);
      });

      // manual hide header
      var $head = $ele.find('.header');
      self.isManual.subscribe(function (m) {
        m ? $head.hide() : $head.show();
      });
      self.isManual.valueHasMutated();
    }

  }
  function Invoice(app, isManual) {
    var self = this,
        staffs = {},
        nscroll = new nScroll(),
        cardreader = new CardReader(),
        signCapture;

    self.option = app.option;
    self.isManual = ko.observable(!!isManual); // manual payment mode
    // class
    function Order(o) {
      var self = this;
      self.order_id = 0;
      self.type = "None";
      self.status = "";
      self.isTakeOut = ko.observable(false);
      self.table = ko.observable('');
      self.name = ko.observable(''); // dinein: staff name ; takeout: contact
      self.ph_table = ko.computed(function () { return self.isTakeOut() ? "Take Out" : "Table #"; });
      self.ph_name = ko.computed(function () { return self.isTakeOut() ? "Contact" : "Staff"; });
      //event
      self.orderTypeClicked = function () {
        self.isTakeOut(!self.isTakeOut());
        self.table("");
        self.name("");
      }
      // init
      if (!!o) {
        self._order = o;
        self.order_id = o.order_id;
        self.type = o.reserve_type;
        self.status = o.status;
        if (self.type.toLowerCase() == 'pickup' || o.table_number.toLowerCase() == "takeout") {
          self.isTakeOut(true);
          self.name(o.reservation_name);
        } else {
          self.isTakeOut(false);
          self.table(o.table_number);
          self.name(o.staff_name);
        }
        self.original_order_id = o.original_order_id;
      }
    }
    function MenuItem(sales_id, title, amount, skip_tax, quantity, options, comment, is_processed, is_complete) {
      var self = this;
      this.sales_id = sales_id;
      this.title = title;
      this.quantity = ko.observable(quantity || 1);
      this.options = ko.observable(options || null);
      this.comment = ko.observable(comment || null);
      this.is_processed = ko.observable(is_processed || false);
      this.skip_tax = ko.observable(skip_tax || false);
      this.is_complete = ko.observable(is_complete || false);
      this.optionObjs = ko.computed(function () {
        var objs = [];
        if (!!self.options()) {
          $.map(self.options().split(','), function (id) {
            if (!!app.option.ref[id]) {
              objs.push(app.option.ref[id]);
            }
          });
        }
        return objs;
      });
      this.option_amount = ko.computed(function () {
        var amount = 0;
        $.map(self.optionObjs(), function (opt) {
          amount += opt.option_amount;
        });
        return amount;
      });
      this.base_amount = amount - this.option_amount();
      this.amount = ko.computed(function () {
        return self.base_amount + self.option_amount();
      });
    }

    //ko observable
    self.order = ko.observable(new Order);
    self.invoice = ko.observable({});
    self.items = ko.observableArray([]);
    self.state = ko.observable('empty'); // empty, new, current, cash, credit, modified, complete, authorized
    self.list_mode = ko.observable(); //add, note, remove, manual, discount, tips, received
    self.ajaxloading = ko.observable(false);
    self.isOnlineOrder = ko.computed(function () {
      return self.order().type !== 'None';
    });
    self.seletedEditItem = ko.observable();
    self.notepeak = ko.observable();
    self.openSignature = ko.observable();

    // head
    self.head_tmpl = ko.computed(function () {
      var tmpl = 'wg_invoice_head';
      if (self.state() == 'new') { tmpl += '_new'; }
      return tmpl;
    });
    self.staffAutoFilled = ko.computed(function () {
      var table = self.order().table().toLowerCase();
      if (table !== "takeout" && table !== "") {
        if (typeof staffs[table] !== "undefined") {
          self.order().name(staffs[table]);
        }
      }
    });

    // itemlist
    self.item_tmpl = ko.computed(function () {
      return self.isManual() ? 'wg_manual_itemlist_item' : 'wg_itemlist_item';
    });

    // summary
    self.subtotal = ko.computed(function () {
      var sum = 0;
      $.each(self.items(), function (i, item) {
        sum += item.amount() * item.quantity();
      });
      return utility.evenRound(sum, 2);
    });
    self.discount_percent = ko.computed({
      read: function () {
        return self.invoice().discount_percent || 0;
      },
      write: function (value) {
        var iv = self.invoice(), v;
        if (value > 100) {
          v = 100;
        } else if (value < 0) {
          v = 0;
        } else {
          v = value;
        }
        iv.discount_percent = parseInt(v);
        self.invoice(iv);
      }
    });
    self.discount_amount = ko.computed(function () {
      var sum = 0;
      $.each(self.items(), function (i, item) {
        sum += utility.evenRound(item.amount() * item.quantity() * self.discount_percent() / 100, 2);
      });
      return sum;
    });
    self.tax_percent = ko.computed(function () {
      return self.invoice().tax_percent || data.tax;
    });
    self.tax_amount = ko.computed(function () {
      var sum = 0;
      $.each(self.items(), function (i, item) {
        if (!item.skip_tax()) {
          dis = utility.evenRound(item.amount() * item.quantity() * self.discount_percent() / 100, 2);
          sum += utility.evenRound((item.amount() * item.quantity() - dis) * self.tax_percent() / 100, 2);
        }
      });
      return sum;
    });
    self.tip_amount = ko.computed({
      read: function () {
        return self.invoice().tip_amount || 0;
      },
      write: function (value) {
        var iv = self.invoice();
        iv.tip_amount = parseFloat(value);
        self.invoice(iv);
      }
    });
    self.tip_persent = ko.observable();
    self.total = ko.computed({
      read: function () {
        return utility.evenRound(self.subtotal() - self.discount_amount() + self.tax_amount() + self.tip_amount(), 2);
      },
      write: function (value) {
        var iv = self.invoice(),
            tip = parseFloat(value) - self.subtotal() - self.tax_amount() + self.discount_amount();
        iv.tip_amount = tip > 0 ? utility.evenRound(tip, 2) : 0;
        self.invoice(iv);
      }
    });
    self.total.subscribe(function () {
      if (self.receivedCash() < self.total()) {
        self.receivedCash(self.total());
      }
    });
    self.receivedCash = ko.observable(0);
    self.cashChange = ko.computed(function () {
      if (self.receivedCash() < self.total()) {
        self.receivedCash(self.total());
      }
      return self.receivedCash() - self.total();
    });
    self.swipedCard = ko.observable();
    self.chargeTo = ko.computed(function () {
      var text = "";
      if (self.swipedCard() !== "") {
        text = self.swipedCard();
      } else if (self.invoice().payment_type == 'credit') {
        text = self.invoice().card_type + " XXXX " + self.invoice().card_last_number;
      } else {
        text = 'Cash';
      }
      return text;
    });

    // signature email
    self.email = ko.observable("");

    // Validate
    self.validateOrder = ko.computed(function () {
      var pass = false,
          order = self.order();
      if (self.items().length) {
        // has items in the list
        if (order.isTakeOut() || self.isManual()) {
          pass = true;
        } else {
          if (order.table() !== "") { pass = true; }
        }
      }
      return pass;
    });

    //method
    self.load = function (order) {
      var dfd;
      if (typeof order == "undefined") {
        // open new order
        self.order(new Order);
        self.state('new');
        self.items([]);
        self.invoice({});

      } else if (order == 'empty') {
        self.order(new Order);
        self.state('empty');
      } else if (order == 'reload') {
        self.load(self.order()._order);
      } else {
        // open old order
        self.order(new Order(order));
        var oid = order.order_id;
        self.ajaxloading(true);
        dfd = $.when(
          ajaxCall.GetInvoice(oid),
          ajaxCall.GetOrderItem(oid)
        ).then(
          function (iv, items) {
            if (order.status == "complete") {
              self.state('complete');
            } else if (order.status == "split") {
              self.state('split');
            } else if (!!order.payment_ref_id) {
              self.state('authorized');
            } else if (!!order.original_order_id) {
              self.state('subbill');
            } else {
              self.state('current');
            }

            self.invoice(iv);
            self.receivedCash(iv.total);
            self.items($.map(items, function (item) {
              return new MenuItem(
                item.sales_id,
                item.title,
                item.amount,
                item.skip_tax,
                item.quantity,
                item.options,
                item.comment,
                item.is_processed,
                item.is_complete);
            }));
            self.ajaxloading(false);
          },
          function () {
            self.ajaxloading(false);
            app.popup.message('Time out<p>Please try again.</p>', 'fail');
          });
      }
      self.list_mode('');
      return dfd;
    }
    self.addItem = function (item) {
      var items = self.items(),
          newitem = new MenuItem(item.sales_id, item.title, item.price, item.is_not_taxable);
      items.push(newitem);
      self.items(items);
      if (self.state() == 'current') {
        self.state('modified');
      }
    }
    self.addManualItem = function (price) {
      self.ajaxloading(true);
      ajaxCall.CreateManualItem().then(function (sales_id) {
        self.ajaxloading(false);
        var items = self.items(),
            newitem = new MenuItem(sales_id, 'Item/Service', price);
        items.push(newitem);
        self.items(items);
        if (self.state() == 'current') {
          self.state('modified');
        }
      }, function () {
        self.ajaxloading(false);
      });
    }
    self.delItem = function (idx) {
      var items = self.items();
      items.splice(idx, 1);
      self.items(items);
      if (self.state() == 'current') {
        self.state('modified');
      }
    }
    self.makeOrder = function () {
      if (self.validateOrder()) {
        var order = ko.toJS(self.order);
        if (self.isManual()) {
          order.table = "manual";
        } else if (order.isTakeOut) {
          order.table = "takeout";
        }
        app.popup.loading();
        ajaxCall.CreateOrder(
          order.table,
          order.name,
          ko.toJS(self.items)
        ).then(function (o) {
          var t_number = o.table_number.toLowerCase();
          if (t_number == 'takeout' || t_number == 'manual') {
            app.orders.load("", o.order_id);
          } else {
            staffs[t_number] = o.staff_name;
            app.orders.load(o.table_number, o.order_id);
          }
          app.tab('payment');
          //print receipt
          app.printer.printOrder(o.order_id, true).then(function (result) {
            console.log('print result:', result);
          });
        },
               function () {
          app.popup.message('Time out<p>Please try again.</p>', 'fail');
        });
      }
    }
    self.updateOrder = function () {
      var dfd = new $.Deferred();
      if (self.validateOrder()) {
        var order = ko.toJS(self.order);
        if (order.isTakeOut) {
          order.table = "takeout";
        }
        dfd = ajaxCall.UpdateOrder(
          order.order_id,
          order.table,
          order.name,
          ko.toJS(self.items)
        ).then(function (o) {
          self.load('reload');
          //print receipt
          app.printer.printOrder(o.order_id, true).then(function (result) {
            console.log('print result:', result);
          },
                                                        function () {
            app.popup.message('Time out<p>Please try again.</p>', 'fail');
          });
        });
      }
      else {
        dfd.reject();
      }
      return dfd;
    }
    self.cancelOrder = function (isVoid) {
      if (!ajaxCall.processing) {
        var o = ko.toJS(self.order),
            msg = "Are you sure to <span class='red'>" + (!!isVoid ? "Void" : "Cancel") + "</span> the order?";

        app.popup.confirm(msg, "cancel", true)
          .done(function () {
          ajaxCall.CancelOrder(o.order_id).done(function (success) {
            if (success) {
              app.orders.load("", 0);
            } else {
              app.popup.message(!!isVoid ? "Void" : "Cancel" + " Failed!", 'fail').done(function () {
                app.orders.load("", 0);
              });
            }
          });
        });
      }
    }

    self.voidOrder = function () {
      if (!ajaxCall.processing) {
        var o = ko.toJS(self.order);
        app.popup.confirm("<span class='red'>Void</span> Payment Transaction?<br/><span class='small'>(Note: Void trasaction cannot be reserved)</span>", "cancel", true)
          .done(function () {
          ajaxCall.VoidOrder(o.order_id).done(function (success) {
            if (success) {
              app.orders.load("", 0);
            } else {
              app.popup.message('Void Failed!', 'fail').done(function () {
                app.orders.load("", 0);
              });
            }
          });
        });
      }
    }

    self.setPaymentMethod = function (trackdata) {
      var dfd;
      if (self.state() == "cash") {
        dfd = ajaxCall.SetCash(self.order().order_id);
      } else if (self.state() == "credit") {
        dfd = ajaxCall.SetSwipe(self.order().order_id, trackdata);
      }
      return dfd;
    }

    // payment
    self.signPay = function () {
      var oid = self.order().order_id,
          sig = signCapture.toDataURL();
      app.popup.loading("Processing");
      ajaxCall.SetSignature(oid, sig, self.email()).done(function () {
        ajaxCall.ProcessPayment(oid, self.invoice().tip_amount, self.invoice().discount_percent).then(
          function (msg) {
            switch (msg) {
              case "success":
                app.popup.message('Payment Success!', 'paid').done(function () {
                  self.openSignature(false);
                  app.orders.load();
                });
                break;
              default:
                app.popup.message('Payment Failed!<p>' + msg + '</p>', 'fail').done(function () {
                  self.load('reload');
                });
            }
          },
          function () {
            app.popup.message('Time out<p>Please try again.</p>', 'fail').done(function () {
              self.load('reload');
            });
          }
        );
      });
    }
    self.processClicked = function () {
      if (self.invoice().tip_amount > 0 || self.state() == 'cash') {
        self.ProcessPayment(true);
      } else {
        if (!ajaxCall.processing) {
          app.popup.loading("Processing");
          var oid = self.order().order_id;
          ajaxCall.AuthorizePayment(oid).then(
            function (msg) {
              switch (msg) {
                case "success":
                  // print order
                  app.popup.message('Payment Success!', 'paid').done(function () {
                    app.orders.load();
                  });
                  app.printer.printOrder(oid, false).then(function (result) {
                    console.log('Print result:', result);
                  });
                  break;
                default:
                  app.popup.message('Payment Failed!<p>' + msg + '</p>', 'fail').done(function () {
                    self.load('reload');
                  });
              }
            },
            function () {
              app.popup.message('Time out<p>Please try again.</p>', 'fail').done(function () {
                self.load('reload');
              });
            }
          );
        }
      }
    }
    self.ProcessPayment = function (receipt) {
      if (!ajaxCall.processing) {
        var oid = self.order().order_id;
        app.popup.loading("Processing");
        ajaxCall.ProcessPayment(oid, self.invoice().tip_amount, self.invoice().discount_percent).done(function (msg) {
          switch (msg) {
            case "success":
              var showmsg = "Payment Complete!";
              if (self.state() == 'cash') {
                showmsg += ("<p> Please Change<div class='change'>$ " + self.cashChange().toFixed(2) + "</div></p>");
              }
              app.popup.message(showmsg, 'paid').done(function () {
                app.orders.load();
              });
              if (!!receipt) {
                app.printer.printOrder(oid, false).then(function (result) {
                  console.log('Print result:', result);
                });
              }
              break;
            default:
              app.popup.message('Payment Failed!<p>' + msg + '</p>', 'fail').done(function () {
                self.load('reload');
              });
          }
        });
      }

    }

    //event
    self.listAction = function (act) {
      (self.list_mode() == act) ? self.list_mode('') : self.list_mode(act);
      //nscroll.resize();
    }
    self.list_mode.subscribe(function (mode) {
      if (self.isManual() && self.state() !== 'new') {
        switch (mode) {
          case 'manual':
            app.keypad.mode('add');
            break;
          case 'discount':
            app.keypad.mode('discount');
            app.keypad.amount(self.discount_percent());
            break;
          case 'tips':
            app.keypad.mode('tips');
            app.keypad.amount(self.tip_amount());
            break;
          case 'received':
            app.keypad.mode('received');
            app.keypad.amount(self.receivedCash());
            break;
          default:
            app.keypad.mode('');
        }
      }
    });

    //btn action
    self.saveChange = function () {
      if (self.validateOrder()) {
        app.popup.confirm('Continue to change?', 'update').done(self.updateOrder);
      } else {
        app.popup.message("Itemlist can't be empty.", 'fail').done(function () {
          self.load('reload');
        });
      }
    };
    self.cancelAction = function () {
      self.load('reload');
    };
    self.swipeClicked = function () {
      app.popup.credit(function (card) {
        var c = ko.toJS(card);
        ajaxCall.SetCredit(self.order().order_id, c).done(function (success) {
          if (success) {
            ajaxCall.GetInvoice(self.order().order_id).done(function (iv) {
              self.invoice(iv);
              self.state('credit');
            });
          } else {
            self.state('current');
          }
          app.popup.hide();
        });
      });
    }
    self.cashClicked = function () {
      self.state("cash");
      self.setPaymentMethod().done(function (success) {
        console.log('setPaymentMethod: '+ success);
        if (!success) {
          self.state("current");
        }
      });
    }
    self.signClicked = function () {
      if (self.state() == "authorized") {
        self.openSignature(true);
      } else if (!ajaxCall.processing) {
        app.popup.loading("Authorizing");
        ajaxCall.AuthorizePayment(self.order().order_id).then(
          function (msg) {
            switch (msg) {
              case "success":
                app.popup.hide();
                self.openSignature(true);
                break;
              default:
                app.popup.message('Authorizing Failed!<p>' + msg + '</p>', 'fail').done(function () {
                  self.load('reload');
                });
            }
          },
          function () {
            app.popup.message('Time out<p>Please try again.</p>', 'fail').done(function () {
              self.load('reload');
            });
          }
        );
      }
    }
    self.signClose = function () {
      self.openSignature(false);
      app.orders.load("", self.order().order_id);
    }
    self.signClear = function () {
      if (!!signCapture) {
        signCapture.clear();
        self.captured(false);
      }
    }
    self.onlinepayClicked = function () {
      self.state("credit");
    }
    self.printClicked = function () {
      var oid = self.order().order_id;
      var tip_amount = self.tip_amount();
      var discount = self.discount_amount();

      ajaxCall.UpdateOrderAmount(oid, tip_amount, discount).done(function (r) {
        app.printer.printOrder(oid, true, true).then(function (result) {
          console.log('Print result:', result);
        });
      });
    }
    self.splitClicked = function () {
      var oid = self.order().order_id;
      var tip_amount = self.tip_amount();
      var discount = self.discount_amount();

      ajaxCall.UpdateOrderAmount(oid, tip_amount, discount).done(function (r) {
        app.popup.split(self.total()).done(function (s) {
          ajaxCall.SplitOrder(oid, s).done(function (r) {
            if (r) {
              app.orders.load(self.order().table());
            } else {
              app.popup.message('Split Failed!', 'fail', false).done(function () {
                self.load('reload');
              });
            }
          });
        });
      });
    }
    self.undoClicked = function () {
      ajaxCall.RemoveSplitOrder(self.order().order_id).done(function (success) {
        if (success) {
          app.tab('payment');
          app.orders.load("", self.order().order_id);
        } else {
          app.popup.message('Undo Failed!', 'fail', false).done(function () {
            app.orders.load("", 0);
          });
        }
      });
    }
    self.cardreaderSwitch = ko.computed(function () {
      if (self.state() == 'current' || self.state() == 'subbill') {
        self.swipedCard("");
        cardreader.start().done(function (trackdata) {
          self.state("credit");
          self.setPaymentMethod(trackdata).done(function (card) {
            if (card !== "False") {
              self.swipedCard(card);
              app.popup.hide();
            } else {
              self.state("current");
            }
          });
        });
      } else {
        cardreader.reset();
      }
    });

    //init and eventbinding
    self.init = function (element) {
      var $ele = $(element[1]).parent(),
          $wg_invoice = $ele.find('.wg_invoice'),
          $wg_actions = $ele.find('.wg_actions'),
          $notePeak = $ele.find('.notePeak'),
          $optionSelector = $ele.find('.optionSelect'),
          $itemlist = $wg_invoice.find('.itemlist'),
          $wg_customer = $ele.find('.wg_customer').hide(),
          canvas = $ele.find('.canvas_signature').get(0);

      //nscroll.add($wg_invoice.find('.body'));

      // height tweak
      function tweakheight() {
        var $head = $wg_invoice.find('.head'),
            $body = $wg_invoice.find('.body'),
            $foot = $wg_invoice.find('.foot');
        $body.height($wg_invoice.height() - $head.outerHeight() - $foot.outerHeight() - (self.isManual() ? 0 : 20));
        $optionSelector.css('top', $head.height());
        //nscroll.resize();
      }
      $(window).bind('resize.itemlist', tweakheight);
      self.state.subscribe(function () {
        setTimeout(tweakheight, 100);
      });
      //itemlist
      self.items.subscribe(function () {
        self.notepeak(null);
        self.seletedEditItem(null);
        $itemlist.find('.dim').removeClass('dim');
        //nscroll.resize();
      });
      //ajaxloading
      self.ajaxloading.subscribe(function (loading) {
        loading ?
          $wg_invoice.add($wg_actions).addClass('dim') :
        $wg_invoice.add($wg_actions).removeClass('dim');
      })
      //signature
      function resizeCanvas() {
        var ratio = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
      }
      $(window).bind('resize.canvas', resizeCanvas);
      signCapture = new SignaturePad(canvas);
      self.openSignature.subscribe(function (open) {
        if (open) {
          $wg_customer.show();
          self.email("");
          signCapture.clear();
          resizeCanvas();
        } else {
          $wg_customer.hide();
        }
      });
      // optionselect
      self.showoptionSelect = ko.computed(function () {
        var show = (self.list_mode() == 'note' && self.option.tags().length && !!self.seletedEditItem());
        if (show) {
          self.option.mode('add');
          $optionSelector.show();
        } else {
          $optionSelector.hide();
        }
        return show;
      });
      $optionSelector.find('.list ul').on(CLICKEVENT, 'li', function () {
        if (!!self.seletedEditItem()) {
          var o_id = ko.dataFor(this).option_id,
              opt = self.seletedEditItem().options();

          if (!!opt) {
            opt += ',' + o_id.toString();
          } else {
            opt = o_id.toString();
          }
          self.seletedEditItem().options(opt);

          if (self.state() == 'current') {
            self.state('modified');
          }
        }
      });
      $optionSelector.bind(CLICKEVENT, function (e) { e.stopPropagation() });
      $itemlist
        .on(CLICKEVENT, '.item', function (e) {
        if (self.list_mode() == 'note') {
          $(this).removeClass('dim').siblings().addClass('dim');
          self.seletedEditItem(ko.dataFor(this));
        }
      })
        .on(CLICKEVENT, '.item .title', function (e) {
        if (self.list_mode() == "") {
          var item = ko.toJS(ko.dataFor(this)),
              $item = $(this).parents('.item'),
              top = $item.offset().top - $wg_invoice.offset().top;

          if (!!self.notepeak() && self.notepeak().sales_id == item.sales_id) {
            $item.siblings().removeClass('dim');
            self.notepeak(null);
          } else if (!!item.comment || item.optionObjs.length) {
            $notePeak.css('top', top);
            $item.removeClass('dim').siblings().addClass('dim');
            self.notepeak(item);
          }
        }
      })
        .on(CLICKEVENT, '.item .icon.remove', function () {
        if (self.list_mode() == "remove") {
          var idx = $(this).parents('.item').index();
          $(this).parents('.item').fadeOut(200, function () {
            self.delItem(idx);
            if (!self.items().length) {
              self.list_mode('');
            }
          });
        }
      })
        .on('change', '.items input', function () {
        // qty or comment changed
        if ($(this).parent().hasClass('qty')) {
          if (this.value <= 0) {
            var idx = $(this).parents('.item').index();
            $(this).parents('.item').fadeOut(200, function () {
              self.delItem(idx);
              if (!self.items().length) {
                self.list_mode('');
              }
            });
          }
        }

        if (self.state() == 'current') {
          self.state('modified');
        }
      })
        .on(CLICKEVENT, '.options .remove', function () {
        var $li = $(this).parents('li'),
            item = ko.contextFor($li.get(0)).$parent;
        item.options($li.siblings().map(function () { return $(this).attr('tid'); }).get().join(','));

        if (self.state() == 'current') {
          self.state('modified');
        }
      });

      // clear notepeak
      $('body').bind(CLICKEVENT, function (e) {
        if (!$(e.target).parents('.item').length) {
          self.notepeak(null);
          self.seletedEditItem(null);
          $itemlist.find('.dim').removeClass('dim');
        }
      });

      $ele.on(CLICKEVENT, "input[type='number']", function () {
        var $input = $(this);
        setTimeout(function () { $input.select(); }, 100);
      });

      $ele.on('keyup', '.head input.first', function (e) {
        if (e.which == 13) {
          self.makeOrder();
        }
      });

      $ele.on('keyup', '.wg_actions input.tip_adjust', function (e) {
        if (e.which == 13) {
          self.ProcessPayment(false);
        }
      });

    }
  }
  function Online(app) {
    var self = this,
        timer_autoload,
        nscroll = new nScroll(),
        master_mode;

    self.newCount = ko.observable(0);
    self.datepicker = new Dropdown();
    self.orders = ko.computed(function () {
      return self.datepicker.value();
    });
    self.selected = ko.observable();
    self.tabOrder = ko.observable();
    self.tabToggle = function () { self.tabOrder(!self.tabOrder()); }
    self.actionbtn = ko.computed(function () {
      if (self.selected()) {
        return self.selected().status();
      } else {
        return ""
      }
    });
    self.table = ko.observable('');
    self.staff = ko.observable('');
    self.validateCheckin = ko.computed(function () { return self.table() !== "" });

    function OnlineOrder(o) {
      var order = this;
      // from order
      order.order_id = ko.observable(o.order_id);
      order.reserve_type = ko.observable(o.reserve_type);
      order.date = ko.observable(o.scheduled_date);
      order.group_size = ko.observable(o.group_size);
      order.special_request = ko.observable(o.special_request);
      order.reservation_name = ko.observable(o.reservation_name);
      order.phone_number = ko.observable(o.phone_number);
      order.email_address = ko.observable(o.email_address);
      order.status = ko.observable(o.status);
      order.typeTxt = ko.computed(function () { return order.reserve_type() == "Preorder" ? "Preorder" : "Take Out" });
      order.isTakeout = ko.computed(function () { return order.reserve_type() !== "Preorder" });
      order.dateTxt = ko.computed(function () { return order.date().formatString('mm/dd/yyyy') });
      order.timeTxt = ko.computed(function () { return order.date().to12h() });
      order.statusTxt = ko.computed(function () {
        switch (order.status()) {
          case 'initiated':
            return 'New Request';
          case 'pre_confirmed':
            return 'Awaiting Payment';
          case 'confirmed':
            return 'Confirmed';
        }
      });
      order.selected = ko.computed(function () {
        if (!!self.selected()) {
          return self.selected().order_id() == order.order_id();
        } else {
          return false;
        }
      });
      order.clicked = function () {
        if (!order.invoice()) {
          order.load();
        }
        self.selected(order);
      }
      // from invoice
      order.invoice = ko.observable();
      order.items = ko.computed(function () {
        return (!!order.invoice()) ? order.invoice().items : [];
      });
      order.subtotal = ko.computed(function () {
        return (!!order.invoice()) ? order.invoice().subtotal : 0;
      });
      order.tax_percent = ko.computed(function () {
        return (!!order.invoice()) ? order.invoice().tax_percent : 0;
      });
      order.tax_amount = ko.computed(function () {
        return (!!order.invoice()) ? order.invoice().tax_amount : 0;
      });
      order.discount_percent = ko.computed(function () {
        return (!!order.invoice()) ? order.invoice().discount_percent : 0;
      });
      order.discount_amount = ko.computed(function () {
        return (!!order.invoice()) ? order.invoice().discount_amount : 0;
      });
      order.total = ko.computed(function () {
        return (!!order.invoice()) ? order.invoice().total : 0;
      });
      order.load = function () {
        var dfd = ajaxCall.GetInvoice(order.order_id()).done(function (iv) {
          order.invoice(iv);
        });
        return dfd;
      }
    }

    //method
    self.confirmOrder = function (confirmed) {
      app.popup.loading("Processing");
      var o = self.selected();
      ajaxCall.ProcessOnlineOrder(o.order_id(), confirmed).done(function () {
        self.load();
        app.popup.hide();
      });
    }
    self.checkIn = function (o) {
      if (self.validateCheckin()) {
        app.popup.loading();
        ajaxCall.CheckInOrder(o.order_id(), self.table(), self.staff()).done(function (d) {
          app.orders.load(self.table(), o.order_id());
          app.tab('payment');
          self.load();
          // print receipt
          app.printer.printOrder(o.order_id(), true).then(function (result) {
            console.log('Print result:', result);
          });
        });
      }
    }

    //init
    self.order_init = function (element) {
      var $ele = $(element[1]).parent();

      master_mode = app.master.mode();

      self.load = function () {
        var prev_idx = self.datepicker.index(),
            p = utility.getNextWeekPeriod(),
            dfd = ajaxCall.GetOnlineOrders(p.start, p.end).done(function (dates) {
              var count = 0, options = [];
              $.map(dates, function (date) {
                var opt = { 'css': 'date' };
                // fixed date
                opt.name = date.date.formatString('mm/dd/yyyy');
                // change order to OnlineOrder view modal
                opt.val = $.map(date.date_orders, function (order) {
                  if (order.status == "initiated" || order.status == "confirmed") { count++ };
                  return new OnlineOrder(order);
                });

                opt.val.sort(sort.descent('date'));
                // make dropdown option
                options.push(opt);
              });
              self.newCount(count);
              self.datepicker.load(options, prev_idx);

              if (!!self.orders()) {
                var prev = $.grep(self.orders(), function (o) {
                  return !!self.selected() && o.order_id() == self.selected().order_id();
                });
                if (prev.length) {
                  prev[0].clicked();
                } else {
                  self.orders()[0].clicked();
                }
              } else {
                self.selected(null);
              }

              $(window).resize();

              // set next timer
              if (timer_autoload) { clearTimeout(timer_autoload); }
              timer_autoload = setTimeout(auto_load, ONLINE_AUTOLOAD_PERIOD);
            });
      }

      function auto_load() {
        if (app.master.mode() == master_mode) {
          self.load();
        }
      }

      self.load();
    }
    self.invoice_init = function (element) {
      var $ele = $(element[1]).parent(),
          $tabs = $ele.find('.tab');

      // height tweak
      function tweakheight() {
        var $head = $ele.find('.head'),
            $itemlist = $ele.find('.itemlist'),
            $summary = $ele.find('.summary');
        $itemlist.height($ele.height() - $head.outerHeight() - $summary.outerHeight() - 10);
      }
      $(window).bind('resize', tweakheight);
      self.tabOrder.subscribe(function (tabOrder) {
        tabOrder ?
          $tabs.hide().filter('.order').show() :
        $tabs.hide().filter('.info').show();

        setTimeout(tweakheight, 100);
      });
      self.selected.subscribe(function (tabOrder) {
        setTimeout(tweakheight, 100);
      });

      self.tabOrder(false);
    }
    self.tab_order_init = function (element) {
      var $ele = $(element[1]).parent();
      //nscroll.add($ele.find('.itemlist'));
    }

  }
  function KeyPad(app) {
    var self = this;

    self.mode = ko.observable('add'); // add, tip, discount
    self.input = ko.observable('');
    self.amount = ko.computed({
      read: function () {
        var result = self.mode() == 'discount' ?
            parseInt(self.input()) || 0 :
        parseFloat(self.input() / 100).toFixed(2);
        return result;
      },
      write: function (val) {
        console.log(val);
        if (val >= 0) {
          self.mode() == 'discount' ?
            self.input((val).toString()) :
          self.input((val * 100).toFixed(0));
        }
        console.log(self.input());
      }
    });
    self.mode.subscribe(function (mode) {
      if (!!app.showKeyPad) {
        app.showKeyPad(!!mode);
      }
    });
    //method
    self.backslash = function () {
      if (self.input().length !== 0) {
        self.input(self.input().slice(0, -1));
      }
    }
    self.clear = function () {
      self.input('');
    }
    self.numClicked = function (num) {
      if (!(self.input().length == 0 && (num == '0' || num == '00'))) {
        if (self.input().length < 10) {
          self.input(self.input() + num);
        }
      }
    }
    self.confirmed = function () {
      switch (self.mode()) {
        case 'add':
          app.invoice.addManualItem(self.amount());
          break;
        case 'tips':
          app.invoice.tip_amount(self.amount());
          app.invoice.list_mode('');
          break;
        case 'received':
          app.invoice.receivedCash(self.amount());
          app.invoice.list_mode('');
          break;
        case 'discount':
          app.invoice.discount_percent(self.amount());
          app.invoice.list_mode('');
          break;
      }
      self.input('');
    }
  }
  // UI
  function Popup(master, element) {
    var self = this,
        touch2close = true,
        $ele = $(element),
        $overlay = $ele.find('.overlay'),
        message_timeout;

    // observables
    self.visible = ko.observable(false);
    self.visible.subscribe(function (show) {
      show ?
        $overlay.show() :
      $overlay.hide();
    });
    self.dialog = ko.observable();
    // dialog interface
    function dialog(name) {
      var dlg = this;
      dlg.name = name;
      dlg.tmpl = 'dialog_' + name;
      dlg.center = function (vertical_center) {
        var $d = $ele.find('.wrapper').children(),
            css = {
              'margin-top': 0,
              'margin-left': -$d.outerWidth() / 2
            };

        if (!!vertical_center) {
          css['margin-top'] = -$d.outerHeight() / 2;
        }
        $d.css(css);
      }
      dlg.init = function () { dlg.center(); };
      return dlg;
    }
    // method
    self.hide = function () {
      touch2close = true;
      self.visible(false);
    }
    // dialogs
    self.loading = function (msg, noblock) {
      var dlg = new dialog('loading');
      dlg.text = msg || "";
      dlg.init = function () { dlg.center(true); };
      // start
      touch2close = !!noblock;
      self.visible(true);
      self.dialog(dlg);
    }
    self.message = function (msg, css, timeout) {
      var dlg = new dialog('message'),
          dfd = new $.Deferred();

      touch2close = true;
      dlg.msg = msg || "";
      dlg.init = function () {
        if (!!css) {
          $ele.find('.dialog').addClass(css);
        }
        dlg.center(true);
      };
      $overlay.one(CLICKEVENT, function () { dfd.resolve(); });
      // start
      self.visible(true);
      self.dialog(dlg);
      // automatic close
      if (!!timeout) {
        if (!!message_timeout) {
          clearTimeout(message_timeout);
        }
        message_timeout = setTimeout(function () {
          if (self.dialog().name == "message") {
            self.hide();
          }
        }, timeout);
      }

      return dfd;
    }
    self.confirm = function (msg, css, btn2) {
      var dlg = new dialog('confirm'),
          dfd = new $.Deferred();

      dlg.msg = msg || "";
      dlg.btn2 = !!btn2;
      dlg.positive = function () {
        dfd.resolve();
        self.hide();
      }
      dlg.negative = function () {
        dfd.reject();
        self.hide();
      }
      dlg.init = function () {
        if (!!css) {
          $ele.find('.dialog').addClass(css);
        }

        $overlay.one(CLICKEVENT, function () {
          dfd.reject();
        });
        dlg.center(true);
      };
      // start
      self.visible(true);
      self.dialog(dlg);
      return dfd;
    }
    self.credit = function (callback, showManual) {
      var dlg = new dialog('credit');
      dlg.showManual = ko.observable(showManual || false);
      dlg.swap = function () {
        dlg.showManual(true);
      };
      dlg.card = new CreditCard();
      dlg.card.submit = function () {
        if (dlg.card.validate()) {
          callback.call(this, dlg.card);
        }
      };
      //start
      self.visible(true);
      self.dialog(dlg);
    }
    self.split = function (total) {
      var dlg = new dialog('split'),
          dfd = new $.Deferred();
      dlg.splitbill = new SplitBill(total, dfd);
      dlg.init = dlg.splitbill.init;

      //start
      self.visible(true);
      self.dialog(dlg);
      dlg.center();
      return dfd;
    }
    self.option = function () {
      if (!!master.pos()) {
        var dlg = new dialog('option');
        dlg.option = master.pos().option;
        dlg.option.mode('edit');
        // start
        self.visible(true);
        self.dialog(dlg);
        dlg.center();
      }
    }
    // default event
    $overlay.children().bind(CLICKEVENT, function (e) {
      e.stopPropagation();
    });
    $overlay.bind(CLICKEVENT, function () {
      if (touch2close) {
        self.visible(false);
      }
    });
  }
  function SlidePanel(master, element) {
    var self = this,
        $ele = $(element),
        $overlay = $ele.find('.overlay'),
        $panel = $ele.find('.panel');
    // observables
    self.visible = ko.observable(false);
    self.panel = ko.observable();
    // panel interface
    function panel(name) {
      this.name = name;
      this.tmpl = 'panel_' + name;
      this.init = function () { };
      return this;
    }

    // Panels
    self.signin = function () {
      var pnl = new panel('signin'),
          dfd = new $.Deferred();

      pnl.init = function () {
        var $register = $ele.find('.register'),
            $email = $ele.find('input.email'),
            $password = $ele.find('input.pw'),
            $submit = $ele.find('.submit'),
            $error = $ele.find('.error').hide(),
            $forget = $ele.find('.forget'),
            $loading = $ele.find('.loading').hide();

        //event
        $register.bind(CLICKEVENT, function () {
          utility.hyperLink('http://marketplace.orengeo.com/registration/createsite.aspx?type=restaurant');
          return false;
        });
        $forget.bind(CLICKEVENT, function () {
          utility.hyperLink('http://' + DOMAIN + '/registration/confirmEmail.aspx');
          return false;
        });
        $submit.bind(CLICKEVENT, function () {
          var email = $email.val(),
              password = $password.val();
          $loading.show();
          ajaxCall.doLogin(email, password).then(
            function (d) {
              if (!!d) {
                // record login time
                localStorage.loginTime = (new Date()).getTime();
                data.dgbid_id = d.dgbid_id;
                data.tax = d.sales_tax;
                var sites = $.grep(d.user_sites, function (s) { return s.site_type == "Restaurant" }); // for restaurant only temporary
                if (sites.length) {
                  data.sites = sites;
                  // by default select first site
                  var s = sites[0];
                  data.site_id = s.site_id;
                  data.site_name = s.site_name;
                  data.site_url = s.site_url;
                  data.site_type = s.site_type;
                  localStorage.userData = $.toJSON(data);
                  master.isSignin(true);
                  self.visible(false);
                  dfd.resolve();
                } else {
                  $error.text("Please, create your website first!").show();
                }
              } else {
                $error.text("Email / Password is invalid.").show();
              }
              $loading.hide();
            },
            function () {
              $error.text("Login Error. Please try again later.").show();
              $loading.hide();
            }
          );

        });
        $password.keyup(function (e) {
          if (e.keyCode == 13) {
            $submit.trigger(CLICKEVENT);
          }
        });
        $ele.find('input').focus(function () { $error.hide(); });
        $overlay.one(CLICKEVENT, function () {
          dfd.reject();
        });
      }

      self.panel(pnl);
      self.visible(true);

      return dfd;
    }
    self.password = function () {
      var pnl = new panel('password'),
          dfd = new $.Deferred();

      pnl.init = function () {
        var $old = $ele.find('input.old'),
            $new = $ele.find('input.new'),
            $confirm = $ele.find('input.confirm'),
            $submit = $ele.find('.submit'),
            $error = $ele.find('.error').hide();

        ajaxCall.GetManagerPW().done(function (oldpw) {
          (oldpw) ?
            $old.prop('disabled', false) :
          $old.prop('disabled', true);
        });

        //Jquery 
        $ele.find('input')
          .bind('blur', function () {
          $error.text("");
        })
          .bind('keypress', function (e) {
          if (e.keyCode == 13) {
            switch ($(this).attr('class')) {
              case "old":
                $new.focus().select();
                break;
              case "new":
                $confirm.focus().select();
                break;
              case "confirm":
                $submit.trigger(CLICKEVENT);
                break;
            }
          }
        });
        $submit.bind(CLICKEVENT, function () {
          var error = "";
          ajaxCall.GetManagerPW().done(function (oldpw) {
            if ($new.val() == "") {
              error = "Password can not be empty";
              $new.focus().select();
            } else if ($new.val() !== $confirm.val()) {
              error = "Re-Enter Password is not matched";
              $confirm.focus().select();
            } else if (!(oldpw == "" || oldpw == null) && $old.val() !== oldpw) {
              error = "Old password is not correct";
              $old.focus().select();

            }

            if (error !== "") {
              $error.text(error).show();
            } else {
              ajaxCall.SetManagerPW($new.val()).done(function (success) {
                if (success) {
                  self.visible(false);
                } else {
                  $error.text('Changing failed, Please try again');
                }
              });
            }
          });

        });
      }

      //init
      self.panel(pnl);
      self.visible(true);
      return dfd;
    }
    self.printer = function () {
      var pnl = new panel('printer'),
          dfd = new $.Deferred();

      pnl.init = function () {
        var $cashier = $ele.find('input.cashier').val(""),
            $kitchen = $ele.find('input.kitchen').val("").hide(),
            $checkbox = $ele.find('.checkbox'),
            $submit = $ele.find('.submit');

        $kitchen.eq(0).show();
        // event
        $kitchen.bind('blur', function () {
          var kips = $.grep($kitchen.map(function () { return $(this).val() }).get(), function (n) {
            return !!n;
          });
          $kitchen.val("").hide().eq(0).show();
          $.each(kips, function (i, ip) {
            $kitchen.eq(i).val(ip);
            $kitchen.eq(i + 1).show();
          });
        });
        $checkbox.bind(CLICKEVENT, function () {
          $(this).toggleClass('selected');
        });
        $submit.bind(CLICKEVENT, function () {
          var r = {};
          r.cashier = $cashier.val();
          r.kitchen = $.grep($kitchen.map(function () { return $(this).val() }).get(), function (n) {
            return !!n;
          }).join(',');
          r.cutpaper = $checkbox.filter('.cutpaper').hasClass('selected');
          r.kickdrawer = $checkbox.filter('.kickdrawer').hasClass('selected');
          r.autoprint = $checkbox.filter('.autoprint').hasClass('selected');
          self.visible(false);
          return master.printer.setPrinter(r.cashier, r.kitchen, r.cutpaper, r.kickdrawer, r.autoprint);
        });
        $overlay.one(CLICKEVENT, function () { dfd.reject(); });

        //restore prev setting
        if (!!master.printer.setting) {
          var setting = master.printer.setting;
          $cashier.val(setting.ip_address);
          if (!!setting.kitchen_ip_address) {
            $.each(setting.kitchen_ip_address.split(','), function (i, ip) {
              $kitchen.eq(i).val(ip).show();
              $kitchen.eq(i + 1).show();
            });
          }
          setting.kick_drawer ?
            $checkbox.filter('.kickdrawer').addClass('selected') :
          $checkbox.filter('.kickdrawer').removeClass('selected');
          setting.cut_feed ?
            $checkbox.filter('.cutpaper').addClass('selected') :
          $checkbox.filter('.cutpaper').removeClass('selected');
          setting.auto_print ?
            $checkbox.filter('.autoprint').addClass('selected') :
          $checkbox.filter('.autoprint').removeClass('selected');
        }
      }

      //init
      self.panel(pnl);
      self.visible(true);
      return dfd;
    }
    self.theme = function () {

      var pnl = new panel('theme'),
          dfd = new $.Deferred();

      pnl.init = function () {

        var $themes = $ele.find('.themes li');

        // event
        $themes.bind(CLICKEVENT, function () {
          $(this).addClass('selected').siblings().removeClass('selected');
          localStorage.theme = $(this).index();
          master.applytheme();
        });

        if (!localStorage.theme) {
          localStorage.theme = 0;
        }
        $themes.eq(localStorage.theme).addClass('selected');


      }

      //init
      self.panel(pnl);
      self.visible(true);
      return dfd;
    }
    self.setting = function () {
      var pnl = new panel('setting'),
          dfd = new $.Deferred();

      pnl.master_mode = master.mode;
      pnl.go2db = function () {
        master.mode('');
        self.visible(false);
      }
      pnl.editoption = master.popup.option;
      pnl.restart = master.restart;
      pnl.signout = master.logout;
      pnl.openDrawer = master.printer.openDrawer;
      self.panel(pnl);
      self.visible(true);
      return dfd;
    }
    //jquery
    $panel.bind(CLICKEVENT, function (e) { e.stopPropagation(); });
    $overlay.bind(CLICKEVENT, function () { self.visible(false); });
  }
  function Dashboard(master, element) {
    var self = this,
        $ele = $(element);
    // ko observables
    self.isSignin = master.isSignin;
    self.signinTxt = ko.computed(function () {
      return master.isSignin() ? 'Sign Out' : 'Sign In';
    });

    // methor
    self.hide = function () { $ele.hide(); };

    // ko event
    function checkLogined(caller) {
      if (self.isSignin()) {
        caller();
      } else {
        master.slide.signin().done(function () {
          caller();
        });
      }
    }
    self.setMPW = function () {
      checkLogined(master.slide.password);
    }
    self.setPrinter = function () {
      checkLogined(master.slide.printer)
    }
    self.setTheme = function () {
      master.slide.theme();
    }
    self.signinClicked = function () {
      var slide = master.slide;
      if (self.isSignin()) {
        // try to signout
        master.logout();
      } else {
        // try to signin
        slide.signin();
      }
    }
    self.modeSelect = function (mode) {
      checkLogined(function () {
        master.mode(mode);
      });
    }
    self.goto = function (url) {
      checkLogined(function () {
        utility.hyperLink(data.site_url + url);
      });
    }

    // jqeury binding
    $ele.find('.sub_menus h3').bind(CLICKEVENT, function () {
      var $menu = $(this).parent('.menu');

      if ($menu.hasClass('expand')) {
        $menu.removeClass('expand');
      } else if (!$menu.hasClass('report')) {
        $menu.addClass('expand').siblings().removeClass('expand');
      } else {
        $menu.siblings().removeClass('expand');
      }

    });
  }
  // APP
  function App(master) {
    var self = this;
    self.master = master;
    self.slide = master.slide;
    self.popup = master.popup;
    self.printer = master.printer;
    self.appTag = ko.observable();
    self.appTabs = ko.observable();
    self.appBody = ko.observable();
    self.tab = ko.observable();
    self.tabSelect = function (tab) {
      self.tab(tab);
    }
    self.setting = function () {
      master.slide.setting();
    }
    self.init = function () { };
  }
  function POS(master, element) {
    //pre-render
    var self = new App(master),
        $ele = $(element);

    self.appTag('POS');
    self.appTabs('app_tabs_pos');
    self.appBody('app_body_pos');
    self.tab(); // order, payment, online, tips, history, customer

    //VM
    self.option = new Option(self);
    self.category = new Category(self);
    self.menu = new Menu(self);
    self.orders = new Orders(self);
    self.invoice = new Invoice(self);
    self.online = new Online(self);
    //event
    self.tabSelect = function (tab) {
      //overwrite
      switch (tab) {
        case 'order':
          self.invoice.load();
          self.tab(tab);
          break;
        case 'payment':
          self.orders.view('current');
          self.orders.orderType('dinein');
          self.orders.load();
          self.tab(tab);
          break;
        case 'online':
          self.online.load();
          self.tab(tab);
          break;
        case 'tips':
          self.orders.view('authorized');
          self.orders.orderType('');
          self.orders.paymentType('');
          self.orders.load();
          self.tab(tab);
          break;
        case 'history':
          self.orders.view('history');
          self.orders.orderType('');
          self.orders.paymentType('');
          self.orders.load();
          self.tab(tab);
          break;
      }
    }
    self.init = function () {
      var $sec = {
        order: $ele.find('.sec_menu,.sec_invoice').hide(),
        payment: $ele.find('.sec_payment,.sec_invoice').hide(),
        online: $ele.find('.sec_online').hide()
      };

      self.viewChange = ko.computed(function () {
        switch (self.tab()) {
          case 'order':
            $sec.order.show().siblings().hide();
            break;
          case 'payment':
            self.invoice.list_mode() == 'add' ? $sec.order.show().siblings().hide() : $sec.payment.show().siblings().hide();
            break;
          case 'online':
            $sec.online.show().siblings().hide();
            break;
          case 'tips':
            $sec.payment.show().siblings().hide();
            break;
          case 'history':
            $sec.payment.show().siblings().hide();
            break;
        }
        $(window).resize();
      });

      // load menu
      $.when(self.menu.load(), self.category.load(), self.option.load()).done(function () {
        self.tabSelect('order'); // open default tab
        $ele.find('.splash').remove();
      });
    }
    return self;
  }
  function POS_online(master, element) {
    var self = new POS(master, element),
        $ele = $(element);

    self.appTag('Online<br/>Order');
    self.appTabs('app_tabs_online');
    self.appBody('app_body_pos');

    self.init = function () {
      var $sec = {
        order: $ele.find('.sec_menu,.sec_invoice').hide(),
        payment: $ele.find('.sec_payment,.sec_invoice').hide(),
        online: $ele.find('.sec_online').hide()
      };

      self.viewChange = ko.computed(function () {
        switch (self.tab()) {
          case 'payment':
            self.invoice.list_mode() == 'add' ? $sec.order.show().siblings().hide() : $sec.payment.show().siblings().hide();
            break;
          case 'online':
            $sec.online.show().siblings().hide();
            break;
          case 'tips':
            $sec.payment.show().siblings().hide();
            break;
          case 'history':
            $sec.payment.show().siblings().hide();
            break;
        }
        $(window).resize();
      });

      // load menu
      $.when(self.menu.load(), self.category.load(), self.option.load()).done(function () {
        self.tabSelect('online'); // open default tab
        $ele.find('.splash').remove();
      });
    }

    return self;
  }
  function POS_manual(master, element) {
    //pre-render
    var self = new App(master),
        $ele = $(element);

    self.appTag('PAYMENT<br/>ONLY');
    self.appTabs('app_tabs_manual');
    self.appBody('app_body_manual');
    self.tab(); // sales, payment, tips, history, customer

    //VM
    self.orders = new Orders(self, true);
    self.invoice = new Invoice(self, true);
    self.keypad = new KeyPad(self);

    //event
    self.tabSelect = function (tab) {
      //overwrite
      switch (tab) {
        case 'sale':
          self.invoice.load();
          self.tab(tab);
          break;
        case 'payment':
          self.orders.view('current');
          self.orders.load();
          self.tab(tab);
          break;
        case 'tips':
          self.orders.view('authorized');
          self.orders.load();
          self.tab(tab);
          break;
        case 'history':
          self.orders.view('history');
          self.orders.load();
          self.tab(tab);
          break;
      }
    }
    self.init = function () {
      var $sec = {
        sale: $ele.find('.sec_sale,.sec_invoice').hide(),
        payment: $ele.find('.sec_payment,.sec_invoice').hide()
      };

      self.showKeyPad = function (on) {
        on ?
          $sec.sale.show().siblings().hide() : $sec.payment.show().siblings().hide();
      }

      self.viewChange = ko.computed(function () {
        switch (self.tab()) {
          case 'sale':
            self.keypad.mode('add');
            break;
          default:
            self.keypad.mode('');
        }
      });

      // load menu
      self.tabSelect('sale'); // open default tab
      $ele.find('.splash').remove();
    }

    return self;
  }
  function Report(master, element) {
    //pre-render
    var self = new App(master),
        $ele = $(element),
        loadTimer;

    self.appTag('Sales<br/>Report');
    self.appTabs('app_tabs_report');
    self.appBody('app_body_report');

    function Sum(data, key) {
      var result = 0;
      $.map(data, function (o) {
        o[key] = parseFloat(o[key]);
        result += o[key];
      });
      return result;
    }
    function Get(data, key, val) {
      var q = $.grep(data, function (o) { return o[key] == val });
      return (q.length) ? q[0] : {
        discount_amount: 0,
        discount_count: 0,
        payment_type: val,
        sales_count: 0,
        tax_amount: 0,
        tip_amount: 0,
        total_paid: 0,
        void_amount: 0,
        void_count: 0
      };
    }
    function Summary(s) {
      var self = this;
      self.credit = Get(s, 'payment_type', 'credit');
      self.cash = Get(s, 'payment_type', 'cash');
      self.total = {
        void_count: Sum(s, 'void_count'),
        void_amount: Sum(s, 'void_amount'),
        discount_count: Sum(s, 'discount_count'),
        discount_amount: Sum(s, 'discount_amount'),
        tax_amount: Sum(s, 'tax_amount'),
        tip_amount: Sum(s, 'tip_amount'),
        sales_count: Sum(s, 'sales_count'),
        total_paid: Sum(s, 'total_paid')
      }
      self.total.gross_sales = self.total.total_paid - self.total.tax_amount - self.total.tip_amount;
      return self;
    }

    // observable
    var d = utility.getPastWeekPeriod();

    self.start = ko.observable(d.start);
    self.end = ko.observable(utility.dateMod(d.end, -1));
    self.startTxt = ko.computed({
      read: function () { return self.start().formatString('mm/dd/yyyy'); },
      write: function (txt) { self.start(new Date(txt)); }
    });
    self.endTxt = ko.computed({
      read: function () { return self.end().formatString('mm/dd/yyyy'); },
      write: function (txt) {
        console.log(txt);
        self.end(new Date(txt));
      }
    });

    self.summary = ko.observable();
    self.total_sales = ko.observable();
    self.number_sales = ko.observable();

    self.load = function () {
      var start = self.start(), end = utility.dateMod(self.end(), +1);
      self.popup.loading();
      return $.when(
        ajaxCall.GetSummary(start, end),
        ajaxCall.GetItemSummaryByAmount(),
        ajaxCall.GetItemSummaryByCount()
      ).then(function (summary, amount, count) {
        self.summary(new Summary(summary));
        self.total_sales({ title: 'Total Sales', showCount: false, items: amount });
        self.number_sales({ title: 'Number of Sales', showCount: true, items: count });
        self.popup.hide();
      },
             function () {
        self.popup.hide();
      });
    }

    // method
    self.go2db = function () { master.mode(''); };
    self.init = function () {
      var $period = $ele.find('.period'),
          $start = $period.find('.start'),
          $end = $period.find('.end');

      function dateChange() {
        if (!!loadTimer) {
          clearTimeout(loadTimer);
        }
        loadTimer = setTimeout(self.load, 400);
      }
      self.start.subscribe(dateChange);
      self.end.subscribe(dateChange);

      // JQ
      $period.find('input').datepicker({ maxDate: new Date() }).change(function () {
        var d = $(this).datepicker('getDate');
        if ($(this).parent().hasClass('start')) {
          self.start(d);
          if ($end.find('input').datepicker('getDate') < d) {
            self.end(d);
          };
        } else {
          self.end(d);
          if ($start.find('input').datepicker('getDate') > d) {
            self.start(d);
          };
        }
      });
      $period.find('.date').click(function () {
        $(this).children('input').datepicker('show');
      });

      self.load();
    }

    return self;
  }
  // MASTER
  function Master() {
    var self = this,
        $slide = $('#slidepnl'),
        $dash = $('#dashboard'),
        $popup = $('#popup'),
        $apps = $('.app'),
        $pos = $('#pos'),
        $online = $('#online'),
        $manual = $('#manual'),
        $report = $('#report');

    //observables
    self.isSignin = ko.observable(false);
    self.mode = ko.observable('');

    // VM
    self.printer = new Printer();
    self.slide = new SlidePanel(self, $slide);
    self.dash = new Dashboard(self, $dash);
    self.popup = new Popup(self, $popup);
    // APP
    self.pos = ko.observable();
    self.online = ko.observable();
    self.manual = ko.observable();
    self.report = ko.observable();

    //method
    self.restart = function () {
      window.location.href = window.location.href;
    }
    self.logout = function () {
      try {
        delete localStorage.loginTime;
        delete localStorage.userData;
      } catch (err) { }
      window.location.href = window.location.href;
    }
    self.applytheme = function () {
      if (!localStorage.theme) {
        localStorage.theme = 0;
      }

      $apps.map(function () {
        var c = $(this).attr('class'),
            theme = "theme" + localStorage.theme;
        if (!!c && c.match(/theme\d+/)) {
          $(this).attr('class', c.replace(/theme\d+/, theme));
        } else if (!!localStorage.theme) {
          $(this).addClass(theme);
        }
      });
    }

    //event
    self.mode.subscribe(function (mode) {
      $apps.hide();
      $dash.hide();
      switch (mode) {
        case 'pos':
          if (!self.pos()) {
            self.pos(new POS(self, $pos));
          }
          $pos.show();
          break;
        case 'online':
          if (!self.online()) {
            self.online(new POS_online(self, $online));
          }
          $online.show();
          break;
        case 'manual':
          if (!self.manual()) {
            self.manual(new POS_manual(self, $manual));
          }
          $manual.show();
          break;
        case 'report':
          if (!self.report()) {
            self.report(new Report(self, $report));
          } else {
            self.report().load();
          }
          $report.show();
          break;
        default:
          $dash.show();
      }
    });

    //reload prev data
    var expired = false;
    if (!!localStorage.userData && !!localStorage.loginTime) {
      var period = new Date().getTime() - parseInt(localStorage.loginTime);
      if (period < LOGIN_EXPIRE_PERIOD) {
        var prevSetting = $.parseJSON(localStorage.userData);
        try {
          delete prevSetting.device_id;
        }
        catch (err) { };
        $.extend(data, prevSetting);
        self.isSignin(true);
      } else {
        try {
          delete localStorage.loginTime;
          delete localStorage.userData;
        }
        catch (err) { }
      }
    }

    // init
    self.applytheme();
  }

  // INIT
  ko.applyBindings(new Master());
});