import { isHighlight } from "../js/components/counter";

describe("Counter component", function(){

    it("should highlight correctly", function(){
        expect(isHighlight(0)).toBe(false);
        expect(isHighlight(1)).toBe(false);
        expect(isHighlight(2)).toBe(true);
    });

});
