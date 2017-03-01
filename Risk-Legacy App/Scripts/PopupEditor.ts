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


interface PopupEditorOptions {
    disableOnEdit?: any;
    //list of fields to disable during an edit, but not edit during an add,
    //  using css selectors JQuery can use, such as:
    //  disableOnEdit: "input[name='phone'],#address,.nameFields"

    submit?: (eventObject: JQueryEventObject) => void;
    //function to execute after user presses submit, prior to submission

    delete?: (eventObject: JQueryEventObject) => void;
    //function to execute when user presses delete

    show?: (loadFrom: any, adding: boolean) => boolean | void;
    //function to execute immediately prior to showing the form
    //return true to always allow saving

    caseSensitiveRegExp?: boolean;
}

class PopupEditor {
    public $modal: JQuery;
    public $form: JQuery;
    public $delete: JQuery;
    public $buttons: JQuery;
    public $submit: JQuery;
    private $disableOnEdit: JQuery;
    private $fieldsToValidate: JQuery;
    private caseSensitiveRegExp: boolean;
    private onSubmitFunction: (eventObject: JQueryEventObject) => void;
    private deleteFunction: (eventObject: JQueryEventObject) => void;
    private showFunction: (loadFrom: any, isAdd: boolean) => void;
    private hiddenFields: any;
    private alwaysAllowSave: boolean;

    constructor(modal: any, options?: PopupEditorOptions) {
        if (!options) options = [];
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
            if ($defaultFocus.length == 0) $defaultFocus = $form.find('input[name]:not([type="hidden"]):not([readonly]):not([disabled]),select[name]:not([readonly]):not([disabled]),textarea[name]:not([readonly]):not([disabled])');
            $defaultFocus.first().focus();
        });

        //load hidden fields and store them for form resets
        var hiddenFields: any[] = [];
        $.each(this.$modal.find('input[type="hidden"][name]'), function (index, obj) {
            hiddenFields[obj.name] = obj.value;
        });
        this.hiddenFields = hiddenFields;
    }
    private EnableSaveButton = () => {
        if (this.alwaysAllowSave) return;
        var changed = false;
        this.$form.find('input[name]:not([type="button"]):not([type="submit"]),select[name],textarea[name]').each(function (index: number, obj: any) {
            var $obj = $(obj);
            if (obj.type == "checkbox" || obj.type == "radio") { //type will be undefined for selects and textareas
                changed = changed || ($obj.data('old') != $obj.prop('checked'));
            } else {
                changed = changed || (($obj.data('old')+'') != ($obj.val()+''));
            }
        });
        this.$submit.prop('disabled', !changed);
    }
    public Add = (loadFrom?: any) => {
        this.Edit(loadFrom, true);
    }
    public Edit = (loadFrom: any, isAdd?: boolean) => {
        isAdd = Boolean(isAdd); //default isAdd to false

        //reset the form to clear any checkboxes or radio
        (<any>(this.$form[0])).reset();
        //reset all hidden form fields
        var hiddenFields = this.hiddenFields;
        $.each(this.$form.find('input[type="hidden"][name]'), function (index, obj) {
            obj.value = hiddenFields[obj.name];
        });
        //load fields
        if (loadFrom) {
            var $loadFrom = $(loadFrom);
            $.each(this.$form.find('input[name],select[name]:not([multiple]),textarea[name]'), function (index, obj) {
                if (obj.type == "checkbox" || obj.type == "radio") { //type will be undefined for selects and textareas
                    $(obj).prop('checked', $loadFrom.data(<string>obj.name) == obj.value);
                } else {
                    var value = $loadFrom.data(<string>obj.name);
                    if (value !== undefined) $(obj).val(value);
                }
            });
            $.each(this.$form.find('select[name][multiple]'), function (index, obj) {
                var values = $loadFrom.data(<string>obj.name) + '';
                if (values !== undefined) {
                    var valuesArray: string[] = values.split(',');
                    $.each($(obj).find('option'), function (index2, obj2) {
                        var $obj2 = $(obj2);
                        var optValue = $obj2.prop('value') + '';
                        $obj2.prop('selected', valuesArray.indexOf(optValue) != -1);
                    });
                }
            });
        }

        this.$submit.prop('disabled', true); //not changed yet
        this.$delete.toggle(!isAdd); //show when editing, hide when not
        this.$disableOnEdit.prop('disabled', !isAdd); //disable specified fields when editing
        if (this.showFunction) {
            this.alwaysAllowSave = !!(this.showFunction(loadFrom, isAdd));
            if (this.alwaysAllowSave) this.$submit.prop('disabled', false);
        } else {
            this.alwaysAllowSave = false;
        }

        if (!this.alwaysAllowSave) {
            //save form field data
            this.$form.find('input[name]:not([type="button"]):not([type="submit"]),select[name],textarea[name]').each(function (index: number, obj: any) {
                var $obj = $(obj);
                if (obj.type == "checkbox" || obj.type == "radio") { //type will be undefined for selects and textareas
                    $obj.data('old', $obj.prop('checked'));
                } else {
                    $obj.data('old', $obj.val());
                }
            });
        }

        this.$modal.modal();
    }
    public Hide = () => {
        this.$modal.modal('hide');
    }
    private submitForm = (eventObject: JQueryEventObject) => {
        var RegExpOptions = this.caseSensitiveRegExp ? '' : 'i';
        for (var i = 0; i < this.$fieldsToValidate.length; i++) {
            var $obj = $(this.$fieldsToValidate[i]);
            if (!$obj.prop('disabled') && !$obj.prop('readonly')) {
                var objVal = $obj.val();
                var objDesc = $obj.data('description');
                if (objVal == '') objVal = null;
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
        if (this.onSubmitFunction) this.onSubmitFunction(eventObject);
    }
    private deleteButton = (eventObject: JQueryEventObject) => {
        if (this.deleteFunction) this.deleteFunction(eventObject);
    }
}

// =============================== AjaxPopupEditor class ========================
// note: div.alert should have style="white-space:pre-wrap;"

interface AjaxPopupEditorOptions {
    disableOnEdit?: any;
    saveUrl?: string; //defaults to form's action attribute
    deleteUrl?: string; //defaults to delete button's formaction attribute
    deleteConfirmationMessage?: string;
    saved?: (data: any) => void;
    deleted?: (data: any) => void;
    show?: (loadFrom: any, adding: boolean) => void;
    serialize?: () => any;
    submit?: (eventObject: JQueryEventObject) => void; //for validation
}
class AjaxPopupEditor {
    private Popup: PopupEditor;
    private $error: JQuery;
    private saveUrl: string;
    private deleteUrl: string;
    private deleteConfirmationMessage: string;
    private ajax: JQueryXHR;
    private ajaxSaving: boolean;
    private savedFunction: (data: any) => void;
    private deletedFunction: (data: any) => void;
    private submitFunction: (eventObject: JQueryEventObject) => void;
    private serializeFunction: () => any;

    constructor(modal: any, options?: AjaxPopupEditorOptions) {
        if (!options) options = [];
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

    public Add = (loadFrom?: any) => {
        this.$error.hide();
        this.Popup.Add(loadFrom);
    }

    public Edit = (loadFrom: any) => {
        this.$error.hide();
        this.Popup.Edit(loadFrom);
    }

    public SetData = ($toSet: JQuery) => {
        $.each(this.Popup.$form.find('input[name],select[name],textarea[name]'), function (index, obj) {
            if (obj.type == 'checkbox') {
                $toSet.data(obj.name, $(obj).prop('checked') ? obj.value : '');
            } else if (obj.type == 'radio') {
                if ($(obj).prop('checked')) $toSet.data(obj.name, obj.value);
            } else {
                $toSet.data(obj.name, obj.value);
            }
        });
    }

    private submitSub = (eventObject: JQueryEventObject) => {
        if (this.submitFunction) this.submitFunction(eventObject);
        if (eventObject.isDefaultPrevented()) return;
        //initiate ajax save in lieu of default submission
        eventObject.preventDefault();
        this.startAjax(true);
    }

    private deleteSub = (eventObject: JQueryEventObject) => {
        eventObject.preventDefault();
        if (this.deleteConfirmationMessage && !confirm(this.deleteConfirmationMessage)) return;
        //initiate ajax delete
        this.startAjax(false);
    }

    private startAjax = (saving: boolean) => {
        if (this.ajax) return;
        this.Popup.$buttons.prop('disabled', true);
        this.ajaxSaving = saving;
        this.ajax = $.ajax({
            complete: this.ajaxComplete,
            data: this.serializeFunction ? this.serializeFunction() : this.Popup.$form.serialize(),
            dataType: 'json',
            error: this.ajaxError,
            type: 'POST',
            url: saving ? this.saveUrl : this.deleteUrl,
            success: this.ajaxSuccess
        });
    }

    private ajaxComplete = () => {
        this.Popup.$buttons.prop('disabled', false);
        this.ajax = null;
    }

    private ajaxSuccess = (data: any) => {
        if (data.Success) {
            this.ajax = null; //so the hide won't call abort
            this.Popup.Hide();
            if (this.ajaxSaving) {
                if (this.savedFunction) this.savedFunction(data);
            } else {
                if (this.deletedFunction) this.deletedFunction(data);
            }
        } else {
            this.displayError(data.ErrorMessage || 'Error transmitting to the server');
        }
    }

    private ajaxError = () => {
        this.displayError('Error transmitting to the server');
    }

    private displayError = (message: string) => {
        if (this.$error.length) {
            this.$error.text(message).show();
        } else {
            alert(message);
        }
    }
}
