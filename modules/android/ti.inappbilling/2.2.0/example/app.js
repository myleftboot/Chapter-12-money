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
 * The example currently provides the 4 android.test purchase requests.
 * With these static requests the restoreTransactions function will not work,
 * also adding a developerPayload will do nothing. Additional 'real' products can be
 * added to the example by following the steps listed here:
 * http://developer.android.com/guide/market/billing/billing_testing.html
 * (See 'Testing In-app Purchases Using Your Own Product IDs')
 * and adding the product IDs to the picker.
 *
 */

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
 * 
 * For security reasons the key should not be added as a complete string, it should be built from several different strings.
 */

//InAppBilling.setPublicKey('<< YOUR KEY HERE >>');

/*
 * UI Setup
 */

var win = Ti.UI.createWindow({
	backgroundColor: 'white',
	title:'InAppBilling Example',
	fullscreen:false,
	exitOnClose:true
});

var scrollView = Ti.UI.createScrollView({
	layout:'vertical'
});

var checkBillingSupportedButton = Ti.UI.createButton({
	title: 'Check Billing Supported',
	enabled: false,
	left:20,
	right:20,
	height:60,
	top:10
});

var checkSubscriptionsSupportedButton = Ti.UI.createButton({
	title: 'Check Subscriptions Supported',
	enabled: false,
	left:20,
	right:20,
	height:60,
	top:10
});

var restoreTransactionsButton = Ti.UI.createButton({
	title: 'Restore Transactions',
	enabled: false,
	left:20,
	right:20,
	height:60,
	top:10
});


var buyButton = Ti.UI.createButton({
	title: 'Buy',
	enabled: false,
	left:20,
	right:20,
	height:60,
	top:10
});

var picker = Ti.UI.createPicker({
	width: 180,
	selectionIndicator: true,
	left:20,
	right:20,
	height:60,
	top:10
});

picker.add([
	Ti.UI.createPickerRow({ title: 'android.test.purchased'}),
	Ti.UI.createPickerRow({ title: 'android.test.canceled' }),
	Ti.UI.createPickerRow({ title: 'android.test.refunded' }),
	Ti.UI.createPickerRow({ title: 'android.test.item_unavailable' }),
	/*
	 * test_product_1 and test_subscription_1 will not work unless they are 
	 * added in the Google Play Android Developer Console and published first
	 * (the app does not need to be published, but the product/subscription does).
	 * 
	 * note: after adding an item, it can take up to an hour before it becomes available 
	 */
	Ti.UI.createPickerRow({ title: 'test_product_1' }),
	Ti.UI.createPickerRow({ title: 'test_subscription_1', productType: InAppBilling.ITEM_TYPE_SUBSCRIPTION})
]);

var addPayloadButton = Ti.UI.createButton({
	title: 'Add Payload',
	left:20,
	right:20,
	height:60,
	top:10
});

var devPayload = '';
	
scrollView.add(checkBillingSupportedButton);
scrollView.add(checkSubscriptionsSupportedButton);
scrollView.add(restoreTransactionsButton);
scrollView.add(buyButton);
scrollView.add(picker);
scrollView.add(addPayloadButton);

win.add(scrollView);
win.open();

picker.setSelectedRow(0, 0, true);

function NotifyMe(text){
	Ti.API.info('< -- > '+text);
	Ti.UI.createNotification({
		message:text,
		duration: Ti.UI.NOTIFICATION_DURATION_SHORT
	}).show();
}

NotifyMe('Open DDMS to see the logs');

/*
 * Helper functions: translate InAppBilling response codes to Strings
 *
 *	InAppBilling response constants
 *	
 *	RESULT_OK
 *	RESULT_USER_CANCELED
 *	RESULT_SERVICE_UNAVAILABLE
 *	RESULT_BILLING_UNAVAILABLE
 *	RESULT_ITEM_UNAVAILABLE
 *	RESULT_DEVELOPER_ERROR
 *	RESULT_ERROR
 *	
 */
function ResponseString(responseCode) {
	switch (responseCode) {
		case InAppBilling.RESULT_OK:
			return 'OK';
		case InAppBilling.RESULT_USER_CANCELED:
			return 'USER CANCELED';
		case InAppBilling.RESULT_SERVICE_UNAVAILABLE:
			return 'SERVICE UNAVAILABLE';
		case InAppBilling.RESULT_BILLING_UNAVAILABLE:
			return 'BILLING UNAVAILABLE';
		case InAppBilling.RESULT_ITEM_UNAVAILABLE:
			return 'ITEM UNAVAILABLE';
		case InAppBilling.RESULT_DEVELOPER_ERROR:
			return 'DEVELOPER ERROR';
		case InAppBilling.RESULT_ERROR:
			return 'RESULT ERROR';
	}
	return '';
}

/*
 *	InAppBilling verification constants
 *	
 *	SIGNATURE_VERIFIED
 *	NULL_DATA
 *	SIGNATURE_ERROR
 *	UNKNOWN_NONCE
 *	PUBLIC_KEY_NULL
 *	
 */
function VerificationString(verificationCode) {
	switch (verificationCode) {
		case InAppBilling.SIGNATURE_VERIFIED:
			return 'SIGNATURE VERIFIED';
		case InAppBilling.NULL_DATA:
			return 'NULL DATA';
		case InAppBilling.SIGNATURE_ERROR:
			return 'SIGNATURE ERROR';
		case InAppBilling.UNKNOWN_NONCE:
			return 'UNKNOWN NONCE';
		case InAppBilling.PUBLIC_KEY_NULL:
			return 'PUBLIC KEY NULL';
	}
	return '';
}

function displaySynchronousResponseCodes(e) {
	var response = ResponseString(e.responseCode);

	NotifyMe('Request Id: ' + e.requestId+ '\n'+'Response code: ' + e.responseCode);

	Ti.API.info('Request Id: ' + e.requestId);
	Ti.API.info('Response code: ' + e.responseCode);
}

addPayloadButton.addEventListener('click', function () {
	var root = Ti.UI.createView({});
	var view = Ti.UI.createView({
		width: 300,
		height: '100'
	});
	var textField = Ti.UI.createTextField({
		width: 300,
		height: 50,
		value: devPayload
	});
	root.add(view);
	view.add(textField);
	var dialog = Ti.UI.createOptionDialog({
		title: 'Add Developer Payload to Item',
		options: null,
		buttonNames: ['OK', 'CANCEL'],
		androidView: root
		
	});
	dialog.show();
	dialog.addEventListener('click', function(e){
		if (e.index == 0) {
			devPayload = textField.value;
		}
	});
});

/*
 * Button Event Listeners
 * 
 */
checkBillingSupportedButton.addEventListener('click', function(e){
	NotifyMe('Check Billing Supported');

	/*
	 * # checkBillingSupported(arg)
	 * Only accepts one arg at a time. Arg must be a productType constant:
	 * 		ITEM_TYPE_INAPP - Standard in-app product (default if no productType specified).
	 * 		ITEM_TYPE_SUBSCRIPTION - Recurring monthly or annual billing product.
	 * passing no arguments will check if ITEM_TYPE_INAPP is supported
	 * this is the same as InAppBilling.checkBillingSupported(InAppBilling.ITEM_TYPE_INAPP);
	 * 
	 * It is possible for a device to only support in-app products and not subscriptions, 
	 * but if subscriptions is supported then in-app products are supported as well.
	 */		
	var synchronousResponse = InAppBilling.checkBillingSupported();
	displaySynchronousResponseCodes(synchronousResponse);
});

checkSubscriptionsSupportedButton.addEventListener('click', function(e){
	NotifyMe('Check Subscriptions Supported');
	
	var synchronousResponse = InAppBilling.checkBillingSupported(InAppBilling.ITEM_TYPE_SUBSCRIPTION);
	displaySynchronousResponseCodes(synchronousResponse);
});

buyButton.addEventListener('click', function(e){
	NotifyMe('Request Purchase');

	/*
	 * # requestPurchase()
	 * args: 
	 * - productId (required) - the id of the product to be purchased
	 * - productType (optional) - accepted product types:
	 * 		ITEM_TYPE_INAPP - Standard in-app product (default if no productType specified).
	 * 		ITEM_TYPE_SUBSCRIPTION - Recurring monthly or annual billing product.
	 * - developerPayload (optional) -  A developer-specified string that contains supplemental information about an order. 
	 */
	var synchronousResponse = InAppBilling.requestPurchase({
		productId: picker.getSelectedRow(0).title,
		productType: picker.getSelectedRow(0).productType,
		developerPayload: devPayload
	});
	displaySynchronousResponseCodes(synchronousResponse);
});

restoreTransactionsButton.addEventListener('click', function(e){
	NotifyMe('Restore Transactions');

	var synchronousResponse = InAppBilling.restoreTransactions();
	displaySynchronousResponseCodes(synchronousResponse);
});

/*
 * Event listeners constants
 *
 *	ON_BIND_EVENT
 *	ON_CONNECT_EVENT
 *	RESPONSE_EVENT
 *	PURCHASE_STATE_CHANGED_EVENT
 *	NOTIFY_EVENT
 *
 *
 */
InAppBilling.addEventListener(InAppBilling.ON_BIND_EVENT, function(e){
	if (e.result == InAppBilling.SUCCESS) {
		NotifyMe('Billing Service Bound');
	} else {
		NotifyMe('Billing Service Bind Failed');
	}
});

InAppBilling.addEventListener(InAppBilling.ON_CONNECT_EVENT, function(e){
	/* 
	 * Enable disabled buttons
	 * They were disabled because sending messages to the service before it is connected, will cause errors.
	 */
	checkBillingSupportedButton.enabled = true;
	checkSubscriptionsSupportedButton.enabled = true;
	restoreTransactionsButton.enabled = true;
	buyButton.enabled = true;
});

InAppBilling.addEventListener(InAppBilling.RESPONSE_EVENT, function(e){
	// Events with (e.sync == true) are deprecated and will be removed. Use the event object that the methods return.
	if(!e.sync){
		NotifyMe('RESPONSE CALLED ' + e.requestId + e.responseCode);
		Ti.API.info('RESPONSE CALLED \n' + 'Request Id:\n' + e.requestId + ' ' + '\nResponse Code:' + ResponseString(e.responseCode));
	}
});

InAppBilling.addEventListener(InAppBilling.PURCHASE_STATE_CHANGED_EVENT, function(e){
	
	NotifyMe('PURCHASE STATE CHANGED CALLED ' + e.signedData + ' ' + e.signature+'\n'+ 'SECURITY RESULT ' + e.result);
	
	Ti.API.info('PURCHASE STATE CHANGED CALLED');
	Ti.API.info('Signature Verification Result:\n' + VerificationString(e.result));
	Ti.API.info('Signed Data:\n' + e.signedData);
	
	if (e.signedData != null) {
		var response = JSON.parse(e.signedData);
		/*
		 * We are not guaranteed to have any orders returned so 
		 * we need to make sure that this one exists before using it.
		 * 
		 * If there is no notificationId then there is no need to confirmNotifications().
		 * This happens when restoreTransactions() triggers a PURCHASE_STATE_CHANGED_EVENT.
		 */
		if (response.orders[0] && response.orders[0].notificationId) {
			var synchronousResponse = InAppBilling.confirmNotifications({
				notificationIds: [response.orders[0].notificationId]
			});
			displaySynchronousResponseCodes(synchronousResponse);
		}
	}
});

InAppBilling.addEventListener(InAppBilling.NOTIFY_EVENT, function(e){
	
	Ti.API.info('NOTIFY CALLED \n' + 'Notify Id:\n' + e.notifyId);
	
	var synchronousResponse = InAppBilling.getPurchaseInformation({
		notificationIds: [e.notifyId]
	});
	displaySynchronousResponseCodes(synchronousResponse);
});

/*
 * Start the billing service after the event listeners are added
 */
InAppBilling.startBillingService();

NotifyMe('Starting Billing Service');

if (Ti.Platform.model === 'Simulator' || Ti.Platform.model.indexOf('sdk') !== -1 ){
	Ti.API.error('InAppBilling Module will not work on an Emulator, it must be run on a Device.');
	alert('InAppBilling Module will not work on an Emulator, it must be run on a Device.');
}

