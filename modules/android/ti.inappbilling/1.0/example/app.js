/*
 * InAppBilling Module Example App
 *
 * Developed for Appcelerator by:
 *   Alexander Conway
 *   Logical Labs, LLC
 *
 * Please direct all questions, feedback, and concerns to info@appcelerator.com.
 *
 * This example app demonstrates the functionality of the InAppBilling Module
 * and the Android In-App Billing Service.
 *
 * NOTE 1:
 *
 * In-App Billing cannot run in the Android emulator!
 *
 * NOTE 2:
 *
 * The example currently provides only the 4 android.test purchase requests.
 * With these static requests the restoreTransactions function will not work,
 * also adding a developerPayload will do nothing. Additional "real" products can be
 * added to the example by following the steps listed here:
 * http://developer.android.com/guide/market/billing/billing_testing.html
 * (See "Testing In-app Purchases Using Your Own Product IDs")
 * and adding the product IDs to the picker.
 *
 */

////////////////////////////////////
//UI Setup
////////////////////////////////////

var App = {

    win: Ti.UI.createWindow({
        backgroundColor: 'white',
    }),

    scrollView: Ti.UI.createScrollView({
        layout: "vertical"
    }),

    topLabel: Ti.UI.createLabel({
        text: "InAppBilling Example",
        font: {
            fontSize: 24
        }
    }),

    setupView: Ti.UI.createView({
        layout: "horizontal",
        left: 5
    }),

    checkBillingSupportedButton: Ti.UI.createButton({
        title: "Check Billing Supported"
    }),

    restoreTransactionsButton: Ti.UI.createButton({
        title: "Restore Transactions",
        enabled: false
    }),

    buyView: Ti.UI.createView({
        layout: "horizontal",
        left: 5
    }),

    buyButton: Ti.UI.createButton({
        title: "Buy",
        enabled: false
    }),

    picker: Ti.UI.createPicker({
        width: 180,
        selectionIndicator: true
    }),

    pickerData: [],

    devPayloadButton: Ti.UI.createButton({
        title: "Add Payload"
    }),

    devPayload: "",

    syncResponseView: Ti.UI.createView({
        layout: "vertical"
    }),
    syncResponseLabel: Ti.UI.createLabel({
        text: "Synchronous Responses"
    }),

    syncResponseMessages: Ti.UI.createTextArea({
            font: {
                fontSize: 14
            },
            height: 160,
            width: 280,
            enabled: false,
            value: ""
        }
    ),

    asyncResponseView: Ti.UI.createView({
        layout: "vertical"
    }),

    asyncResponseLabel: Ti.UI.createLabel({
        text: "Asynchronous Responses"
    }),

    asyncResponseMessages: Ti.UI.createTextArea({
            font: {
                fontSize: 14
            },
            height: 500,
            width: 280,
            enabled: false,
            value: ""
        }
    )
};

App.setupView.add(App.checkBillingSupportedButton);
App.setupView.add(App.restoreTransactionsButton);

App.pickerData[0] = Ti.UI.createPickerRow({
    title: 'android.test.purchased'
});
App.pickerData[1] = Ti.UI.createPickerRow({
    title: 'android.test.canceled'
});
App.pickerData[2] = Ti.UI.createPickerRow({
    title: 'android.test.refunded'
});
App.pickerData[3] = Ti.UI.createPickerRow({
    title: 'android.test.item_unavailable'
});

App.picker.add(App.pickerData);

App.devPayloadButton.addEventListener('click', function () {

    var dialog = Titanium.UI.createOptionDialog();

    // For now, you must give the containing view dimensions in order for it to appear.
    var root = Ti.UI.createView({});

    var view = Ti.UI.createView({
        width: 300,
        height: '100'
    });

    root.add(view);

    var textField = Ti.UI.createTextField({
        width: 300,
        height: 50,
        value: App.devPayload
    });

    view.add(textField);

    dialog.addEventListener('click', function (e) {
        if (e.index == 0) {
            App.devPayload = textField.value;
        }
    });
    dialog.title = 'Add Developer Payload to Item';
    dialog.options = null;
    dialog.buttonNames = ['OK', 'CANCEL'];
    dialog.androidView = root;
    dialog.show();

});
App.buyView.add(App.buyButton);
App.buyView.add(App.picker);
App.buyView.add(App.devPayloadButton);

App.picker.setSelectedRow(0, 0, true);

App.syncResponseView.add(App.syncResponseLabel);
App.syncResponseView.add(App.syncResponseMessages);

App.asyncResponseView.add(App.asyncResponseLabel);
App.asyncResponseView.add(App.asyncResponseMessages);

App.scrollView.add(App.topLabel);
App.scrollView.add(Ti.UI.createView({
    height: 10
}));
App.scrollView.add(App.setupView);
App.scrollView.add(Ti.UI.createView({
    height: 10
}));
App.scrollView.add(App.buyView);
App.scrollView.add(Ti.UI.createView({
    height: 10
}));
App.scrollView.add(App.syncResponseView);
App.scrollView.add(Ti.UI.createView({
    height: 10
}));
App.scrollView.add(App.asyncResponseView);

App.win.add(App.scrollView);

App.win.open();

////////////////////////////////////
//Module Implementation
////////////////////////////////////

/*
 * First include the Module
 */

var InAppBilling = require('ti.inappbilling');

/*
 * Set Public Key for signature verification
 * (Not required: If not set, module won't verify)
 */

//InAppBilling.setPublicKey("<< YOUR KEY HERE >>");

/*
 * Add Event Listeners
 */

InAppBilling.addEventListener(InAppBilling.ON_BIND_EVENT, function (e) {
    if (e.result == InAppBilling.SUCCESS) {
        Ti.API.info("Billing Service Bound");
    } else {
        Ti.API.info("Billing Service Bind Failed");
    }
});

InAppBilling.addEventListener(InAppBilling.ON_CONNECT_EVENT, function (e) {
    InAppBilling.checkBillingSupported();
    App.buyButton.enabled = true;
    App.restoreTransactionsButton.enabled = true;
});

InAppBilling.addEventListener(InAppBilling.RESPONSE_EVENT, function (e) {
    Ti.API.info("RESPONSE CALLED " + e.requestId + e.responseCode);
    if (e.sync == true) {
        App.callback(e.requestId, e.responseCode);
    } else {
        App.asyncResponseMessages.value += "RESPONSE CALLED \n" + "Request Id:\n" + e.requestId + " " + "\nResponse Code:" + App.getResponseString(e.responseCode) + "\n";
    }
});

InAppBilling.addEventListener(InAppBilling.PURCHASE_STATE_CHANGED_EVENT, function (e) {
    Ti.API.info("PURCHASE STATE CHANGED CALLED " + e.signedData + " " + e.signature);
    Ti.API.info("SECURITY RESULT " + e.result);
    App.asyncResponseMessages.value += "PURCHASE STATE CHANGED CALLED \n";
    App.asyncResponseMessages.value += "Signature Verification Result:\n" + App.getVerificationString(e.result) + "\n";
    App.asyncResponseMessages.value += "Signed Data:\n" + e.signedData + "\n";
    if (e.signedData != null) {
        var response = Titanium.JSON.parse(e.signedData);
        InAppBilling.confirmNotifications({
            notificationIds: [response.orders[0].notificationId]
        });
    }
});

InAppBilling.addEventListener(InAppBilling.NOTIFY_EVENT, function (e) {
    App.asyncResponseMessages.value += "NOTIFY CALLED \n" + "Notify Id:\n" + e.notifyId + "\n";
    InAppBilling.getPurchaseInformation({
        notificationIds: [e.notifyId]
    });
});

App.callback = function (requestId, responseCode) {
    var response = App.getResponseString(responseCode)
    Ti.API.info("Request Id: " + requestId);
    Ti.API.info("Response code: " + response);
    App.syncResponseMessages.value += "Request Id: " + requestId + "\n";
    App.syncResponseMessages.value += "Response code: " + response + "\n";
};

/*
 * 
 * Have the "Check Billing Supported" button initialize the billing service
 */

App.checkBillingSupportedButton.addEventListener("click", function (e) {
    Ti.API.info("Starting Billing Service");
    InAppBilling.startBillingService();
});


App.buyButton.addEventListener("click", function (e) {
    App.asyncResponseMessages.value = "";
    Ti.API.info("Request Purchase ");
    InAppBilling.requestPurchase({
        productId: App.picker.getSelectedRow(0).title,
        developerPayload: App.devPayload
    });
});

App.restoreTransactionsButton.addEventListener("click", function (e) {
    App.asyncResponseMessages.value = "";
    Ti.API.info("Restore Transactions");
    InAppBilling.restoreTransactions();
});

/*
 * Helper functions: translate InAppBilling response codes to Strings
 */

App.getResponseString = function (responseCode) {
    var response;
    switch (responseCode) {
        case InAppBilling.RESULT_OK:
            response = "OK";
            break;
        case InAppBilling.RESULT_USER_CANCELED:
            response = "USER CANCELED";
            break;
        case InAppBilling.RESULT_SERVICE_UNAVAILABLE:
            response = "SERVICE UNAVAILABLE";
            break;
        case InAppBilling.RESULT_BILLING_UNAVAILABLE:
            response = "BILLING UNAVAILABLE";
            break;
        case InAppBilling.RESULT_ITEM_UNAVAILABLE:
            response = "ITEM UNAVAILABLE";
            break;
        case InAppBilling.RESULT_DEVELOPER_ERROR:
            response = "DEVELOPER ERROR";
            break;
        case InAppBilling.RESULT_ERROR:
            response = "RESULT ERROR";
            break;
    }
    return response;
};
App.getVerificationString = function (verificationCode) {
    var response;
    switch (verificationCode) {
        case InAppBilling.SIGNATURE_VERIFIED:
            response = "SIGNATURE VERIFIED";
            break;
        case InAppBilling.NULL_DATA:
            response = "NULL DATA";
            break;
        case InAppBilling.SIGNATURE_ERROR:
            response = "SIGNATURE ERROR";
            break;
        case InAppBilling.UNKNOWN_NONCE:
            response = "UNKNOWN NONCE";
            break;
        case InAppBilling.PUBLIC_KEY_NULL:
            response = "PUBLIC KEY NULL";
            break;
    }
    return response;
};