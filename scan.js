
$(function () {
    // Create the QuaggaJS config object for the live stream
    var liveStreamConfig = {
        inputStream: {
            type: "LiveStream",
            constraints: {
                width: { min: 640, max: 640 },
                height: { min: 480, max: 480 },
                aspectRatio: { min: 1, max: 100 },
                facingMode: "environment" // or "user" for the front camera
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: (navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4),
        decoder: {
            "readers": [
                { "format": "code_39_reader", "config": {} },
				{ "format": "ean_reader", "config": {} },
                { "format": "ean_2_reader", "config": {} },
                { "format": "ean_5_reader", "config": {} },
                { "format": "ean_8_reader", "config": {} },
                { "format": "upc_reader", "config": {} },
                { "format": "upc_e_reader", "config": {} }
            ]
        },
        locate: true
    };
    // The fallback to the file API requires a different inputStream option. 
    // The rest is the same 
    var fileConfig = $.extend(
        {},
        liveStreamConfig,
        {
            inputStream: {
                size: 800
            }
        }
    );
    // Start the live stream scanner when the modal opens
    $('#livestream_scanner').on('shown.bs.modal', function (e) {
        $('#livestream_scanner .modal-body .error').html('');
        $('#interactive').height('0px');
        document.getElementById('fileSel').style = "float:left;display:none;";

        Quagga.init(
            liveStreamConfig,
            function (err) {
                if (err) {
                    document.getElementById('fileSel').style = "float:left;display:inline;";
                    Quagga.stop();
                    return;
                }
                else {
                    $('#interactive').height('30vh');
                    Quagga.start();
                    Quagga.CameraAccess.getActiveTrack().applyConstraints({ advanced: [{ torch: true }] });
                }
            }
        );
    });
    // Make sure, QuaggaJS draws frames an lines around possible 
    // barcodes on the live stream
    Quagga.onProcessed(function (result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
                });
            }

            if (result.box) {
                //Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
            }
        }
    });

    // Once a barcode had been read successfully, stop quagga and 
    // close the modal after a second to let the user notice where 
    // the barcode had actually been found.
    Quagga.onDetected(function (result) {
        if (result.codeResult.code) {
            $('#scanner_input').val(result.codeResult.code);
            document.getElementById('invoice-bill').style = "display:block;";
            document.getElementById("invoice-id").value = result.codeResult.code
            // $("#invoice-boxs").printThis();
            setTimeout(function () {
                Quagga.stop();
                $('#livestream_scanner').modal('hide');
            }, 300);
        }
        // $('#invoice-boxs').printThis();
    });

    // Stop quagga in any case, when the modal is closed
    $('#livestream_scanner').on('hide.bs.modal', function () {
        if (Quagga) {
            $('#interactive').html('');
            Quagga.stop();
        }
    });

    // Call Quagga.decodeSingle() for every file selected in the 
    // file input
    $("#livestream_scanner input:file").on("change", function (e) {
        $('#livestream_scanner .modal-body .error').html('');
        $('#interactive').html('');

        document.getElementById('interactive').style = "height:auto;min-height:0px;max-height:60vh;";
        if (e.target.files && e.target.files.length) {
            Quagga.decodeSingle($.extend({}, fileConfig, { src: URL.createObjectURL(e.target.files[0]) }), function (result) {
                var barcode = result.codeResult.code;
            });
        }
    });
});
