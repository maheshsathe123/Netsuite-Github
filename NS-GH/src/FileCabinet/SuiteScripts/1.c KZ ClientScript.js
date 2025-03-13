/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(["N/currentRecord"], function (currentRecord) {
    function pageInit(context) {
      // This function runs when the page is initialized
    }
   
    function openProjectInfoSuitelet() {
      // Get the current record object
      var rec = currentRecord.get();
   
      // Get the Purchase Order ID
      var poId = rec.id;
      log.debug(poId);
   
      // Check if poId is retrieved properly
      if (!poId) {
        alert("Purchase Order ID not found.");
        return;
      }
   
      // Define the Suitelet URL (replace script and deploy with your actual IDs)
      var suiteletUrl =
        "/app/site/hosting/scriptlet.nl?script=2690&deploy=1&poId=" + poId;
   
      log.debug(suiteletUrl);
   
      // var suiteletUrl = url.resolveScript({
      //   scriptId: "2667", // Update with your Suitelet script ID
      //   deploymentId: "1", // Update with your Suitelet deployment ID
      //   params: { poId: poId }, // Pass the PO ID as a parameter
      // });
   
      log.debug(poId);
   
      // Open the Suitelet in a popup window
      window.open(
        suiteletUrl,
        "ProjectInfo",
        "width=600,height=400,resizable=yes,scrollbars=yes"
      );
    }
   
    return {
      pageInit: pageInit, // Adding pageInit as an entry point for the Client Script
      openProjectInfoSuitelet: openProjectInfoSuitelet, // Function to open the Suitelet in a popup
    };
  });