(function () {
    if (typeof WinJS !== "undefined") {
        "use strict";

        WinJS.Binding.optimizeBindingReferences = true;

        var app = WinJS.Application;
        var activation = Windows.ApplicationModel.Activation;

        app.onsettings = function (e) {
            e.detail.applicationcommands = {
                "PrivacyPolicy": {
                    title: "Privacy Policy", href: "/privacypolicy.html"
                }
            };
            WinJS.UI.SettingsFlyout.populateSettings(e);
        }

        app.onactivated = function (args) {
            if (args.detail.kind === activation.ActivationKind.launch) {
                if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                    eventBinding();
                } else {
                }
                args.setPromise(WinJS.UI.processAll());
            }
        };

        app.oncheckpoint = function (args) {

        };

        function eventBinding() {
            // window change check snapped view event
            var $snap = $('#snapscreen').hide();
            $(window).resize(function () {
                var currentViewState = Windows.UI.ViewManagement.ApplicationView.value;
                if (currentViewState !== 0) {
                    //fullscreen 0
                    console.log('snap mode');
                    $snap.show();
                } else {
                    $snap.hide();
                }
            });
        }

        console.log("WinJS start");
        app.start();


    } else {
        console.log("No WinJS lib");
    }
})();