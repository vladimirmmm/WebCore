class ValidationFuntionContainer
{
    public Required = function (item) { return !IsNull(item); };
    public Regex = function (item, regex) { return (new RegExp(regex).test(item)) };
    public Number = function (item, regex) { return (new RegExp(/^[+-]?((\d+(\.\d*)?)|(\.\d+))$/).test(item)) };
    public Functions(): Function[]
    {
        var me = this;
        var funcs: Function[] = [];
        //for (var f in me)
        //{
        //    funcs.push(<Function>me[f]);
        //}
        return funcs;
    }
    constructor()
    {

    }
}