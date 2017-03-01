/*
PopupEditor class

Version 1.2

Syntax:
var myPopup = new PopupEditor(modal);
var myPopup = new PopupEditor(modal, options);
myPopup.Add();
myPopup.Add(loadFrom);
myPopup.Edit(loadFrom);
myPopup.Hide();

Pre-requisites:
- form action and method properties are set properly for saving a new/existing form
- <form> encompasses all form fields and buttons, and is within the modal div
- save button is <input type="submit" />
- delete button is <input type="submit" formnovalidate formaction="--deletepage--" data-action="delete" />
- cancel button is <input type="button" data-dismiss="modal" />
- buttons can use <button> or <input>
- form fields and buttons do not require id tags
- buttons can use value tags to label the buttons
- reset buttons are not currently supported (of type <input type="reset"> )
- all form field names are lower case
- form fields can have data-regex and data-description fields for optional validation
- tags for multiple-selection list boxes expect a data format of <value>,<value>,<value> such as 1,4

Standard usage:
- show list of items to edit
- each item link calls myPopup.Edit similar to this <a href="#" onclick="myPopup.Edit(this);return false;">
- each passed reference to Edit has data- tags for each named field of the form, such as:
    <a href="#" onclick="myPopup.Edit(this);return false;" data-contactid="3" data-firstname="john" data-lastname="doe">Edit John Doe</a>
- add buttons call myPopup.Add(), or can pass a reference to Add similar to Edit to fill in certain fields

*/
var PopupEditor = (function () {
    function PopupEditor(modal, options) {
        var _this = this;
        this.EnableSaveButton = function () {
            if (_this.alwaysAllowSave)
                return;
            var changed = false;
            _this.$form.find('input[name]:not([type="button"]):not([type="submit"]),select[name],textarea[name]').each(function (index, obj) {
                var $obj = $(obj);
                if (obj.type == "checkbox" || obj.type == "radio") {
                    changed = changed || ($obj.data('old') != $obj.prop('checked'));
                }
                else {
                    changed = changed || (($obj.data('old') + '') != ($obj.val() + ''));
                }
            });
            _this.$submit.prop('disabled', !changed);
        };
        this.Add = function (loadFrom) {
            _this.Edit(loadFrom, true);
        };
        this.Edit = function (loadFrom, isAdd) {
            isAdd = Boolean(isAdd); //default isAdd to false
            //reset the form to clear any checkboxes or radio
            (_this.$form[0]).reset();
            //reset all hidden form fields
            var hiddenFields = _this.hiddenFields;
            $.each(_this.$form.find('input[type="hidden"][name]'), function (index, obj) {
                obj.value = hiddenFields[obj.name];
            });
            //load fields
            if (loadFrom) {
                var $loadFrom = $(loadFrom);
                $.each(_this.$form.find('input[name],select[name]:not([multiple]),textarea[name]'), function (index, obj) {
                    if (obj.type == "checkbox" || obj.type == "radio") {
                        $(obj).prop('checked', $loadFrom.data(obj.name) == obj.value);
                    }
                    else {
                        var value = $loadFrom.data(obj.name);
                        if (value !== undefined)
                            $(obj).val(value);
                    }
                });
                $.each(_this.$form.find('select[name][multiple]'), function (index, obj) {
                    var values = $loadFrom.data(obj.name) + '';
                    if (values !== undefined) {
                        var valuesArray = values.split(',');
                        $.each($(obj).find('option'), function (index2, obj2) {
                            var $obj2 = $(obj2);
                            var optValue = $obj2.prop('value') + '';
                            $obj2.prop('selected', valuesArray.indexOf(optValue) != -1);
                        });
                    }
                });
            }
            _this.$submit.prop('disabled', true); //not changed yet
            _this.$delete.toggle(!isAdd); //show when editing, hide when not
            _this.$disableOnEdit.prop('disabled', !isAdd); //disable specified fields when editing
            if (_this.showFunction) {
                _this.alwaysAllowSave = !!(_this.showFunction(loadFrom, isAdd));
                if (_this.alwaysAllowSave)
                    _this.$submit.prop('disabled', false);
            }
            else {
                _this.alwaysAllowSave = false;
            }
            if (!_this.alwaysAllowSave) {
                //save form field data
                _this.$form.find('input[name]:not([type="button"]):not([type="submit"]),select[name],textarea[name]').each(function (index, obj) {
                    var $obj = $(obj);
                    if (obj.type == "checkbox" || obj.type == "radio") {
                        $obj.data('old', $obj.prop('checked'));
                    }
                    else {
                        $obj.data('old', $obj.val());
                    }
                });
            }
            _this.$modal.modal();
        };
        this.Hide = function () {
            _this.$modal.modal('hide');
        };
        this.submitForm = function (eventObject) {
            var RegExpOptions = _this.caseSensitiveRegExp ? '' : 'i';
            for (var i = 0; i < _this.$fieldsToValidate.length; i++) {
                var $obj = $(_this.$fieldsToValidate[i]);
                if (!$obj.prop('disabled') && !$obj.prop('readonly')) {
                    var objVal = $obj.val();
                    var objDesc = $obj.data('description');
                    if (objVal == '')
                        objVal = null;
                    var valRequired = $obj.prop('required');
                    if (objVal == null && valRequired) {
                        alert(objDesc + ' is required');
                        eventObject.preventDefault();
                        $obj.focus();
                        return;
                    }
                    if (objVal != null) {
                        var regexp = new RegExp($obj.data('regex'), RegExpOptions);
                        if (!regexp.test(objVal)) {
                            alert(objDesc + ' is invalid');
                            eventObject.preventDefault();
                            $obj.focus();
                            return;
                        }
                    }
                }
            }
            if (_this.onSubmitFunction)
                _this.onSubmitFunction(eventObject);
        };
        this.deleteButton = function (eventObject) {
            if (_this.deleteFunction)
                _this.deleteFunction(eventObject);
        };
        if (!options)
            options = [];
        this.$modal = $(modal);
        this.$form = this.$modal.find('form').on('submit', this.submitForm);
        this.$delete = this.$modal.find('button[data-action="delete"],input[type="submit"][data-action="delete"],input[type="button"][data-action="delete"]').click(this.deleteButton);
        this.$submit = this.$modal.find('button[type="submit"]:not([data-action]),input[type="submit"]:not([data-action])');
        //this.$modal.find('button[data-action="cancel"],input[type="button"][data-action="cancel"]').click(this.cancelButton);
        this.$buttons = this.$modal.find('button,input[type="submit"],input[type="button"],input[type="reset"]');
        this.$disableOnEdit = this.$modal.find(options.disableOnEdit);
        this.$fieldsToValidate = this.$modal.find('input[data-regex]');
        this.caseSensitiveRegExp = options.caseSensitiveRegExp;
        this.onSubmitFunction = options.submit;
        this.deleteFunction = options.delete;
        this.showFunction = options.show;
        this.$modal.find('input[name]:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]),textarea[name]').on('input', this.EnableSaveButton);
        this.$modal.find('select[name]').change(this.EnableSaveButton);
        this.$modal.find('input[name][type="checkbox"],input[name][type="radio"]').click(this.EnableSaveButton);
        this.$modal.on('shown.bs.modal', function () {
            var $form = $(this).find('form');
            var $defaultFocus = $form.find('.defaultfocus');
            if ($defaultFocus.length == 0)
                $defaultFocus = $form.find('input[name]:not([type="hidden"]):not([readonly]):not([disabled]),select[name]:not([readonly]):not([disabled]),textarea[name]:not([readonly]):not([disabled])');
            $defaultFocus.first().focus();
        });
        //load hidden fields and store them for form resets
        var hiddenFields = [];
        $.each(this.$modal.find('input[type="hidden"][name]'), function (index, obj) {
            hiddenFields[obj.name] = obj.value;
        });
        this.hiddenFields = hiddenFields;
    }
    return PopupEditor;
}());
var AjaxPopupEditor = (function () {
    function AjaxPopupEditor(modal, options) {
        var _this = this;
        this.Add = function (loadFrom) {
            _this.$error.hide();
            _this.Popup.Add(loadFrom);
        };
        this.Edit = function (loadFrom) {
            _this.$error.hide();
            _this.Popup.Edit(loadFrom);
        };
        this.SetData = function ($toSet) {
            $.each(_this.Popup.$form.find('input[name],select[name],textarea[name]'), function (index, obj) {
                if (obj.type == 'checkbox') {
                    $toSet.data(obj.name, $(obj).prop('checked') ? obj.value : '');
                }
                else if (obj.type == 'radio') {
                    if ($(obj).prop('checked'))
                        $toSet.data(obj.name, obj.value);
                }
                else {
                    $toSet.data(obj.name, obj.value);
                }
            });
        };
        this.submitSub = function (eventObject) {
            if (_this.submitFunction)
                _this.submitFunction(eventObject);
            if (eventObject.isDefaultPrevented())
                return;
            //initiate ajax save in lieu of default submission
            eventObject.preventDefault();
            _this.startAjax(true);
        };
        this.deleteSub = function (eventObject) {
            eventObject.preventDefault();
            if (_this.deleteConfirmationMessage && !confirm(_this.deleteConfirmationMessage))
                return;
            //initiate ajax delete
            _this.startAjax(false);
        };
        this.startAjax = function (saving) {
            if (_this.ajax)
                return;
            _this.Popup.$buttons.prop('disabled', true);
            _this.ajaxSaving = saving;
            _this.ajax = $.ajax({
                complete: _this.ajaxComplete,
                data: _this.serializeFunction ? _this.serializeFunction() : _this.Popup.$form.serialize(),
                dataType: 'json',
                error: _this.ajaxError,
                type: 'POST',
                url: saving ? _this.saveUrl : _this.deleteUrl,
                success: _this.ajaxSuccess
            });
        };
        this.ajaxComplete = function () {
            _this.Popup.$buttons.prop('disabled', false);
            _this.ajax = null;
        };
        this.ajaxSuccess = function (data) {
            if (data.Success) {
                _this.ajax = null; //so the hide won't call abort
                _this.Popup.Hide();
                if (_this.ajaxSaving) {
                    if (_this.savedFunction)
                        _this.savedFunction(data);
                }
                else {
                    if (_this.deletedFunction)
                        _this.deletedFunction(data);
                }
            }
            else {
                _this.displayError(data.ErrorMessage || 'Error transmitting to the server');
            }
        };
        this.ajaxError = function () {
            _this.displayError('Error transmitting to the server');
        };
        this.displayError = function (message) {
            if (_this.$error.length) {
                _this.$error.text(message).show();
            }
            else {
                alert(message);
            }
        };
        if (!options)
            options = [];
        this.Popup = new PopupEditor(modal, {
            disableOnEdit: options.disableOnEdit,
            submit: this.submitSub,
            delete: this.deleteSub,
            show: options.show
        });
        this.$error = $(modal).find('.alert');
        this.saveUrl = options.saveUrl || this.Popup.$form.attr('action');
        this.deleteUrl = options.deleteUrl || this.Popup.$delete.attr('formaction');
        this.deleteConfirmationMessage = options.deleteConfirmationMessage;
        this.savedFunction = options.saved;
        this.deletedFunction = options.deleted;
        this.serializeFunction = options.serialize;
        this.submitFunction = options.submit;
        var this2 = this;
        this.Popup.$modal.on('hidden.bs.modal', function () {
            if (this2.ajax) {
                this2.ajax.abort();
                this2.ajaxComplete();
            }
        });
    }
    return AjaxPopupEditor;
}());
//# sourceMappingURL=PopupEditor.js.map