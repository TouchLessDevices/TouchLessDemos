export function pointIntersectsRect(p:{x:number, y:number},box:DOMRect) {
    return !(p.x < box.left || p.x > box.right || p.y > box.bottom || p.y < box.top)
}
