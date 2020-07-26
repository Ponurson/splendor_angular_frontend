import {animate, state, style, transition, trigger} from '@angular/animations';

export const Animations = [
    trigger('pageAnimations', [
        transition('open => close', [
            animate('500ms 0.1s ease',
                style({opacity: 0.1, transform: 'translate({{posX}}px,{{posY}}px)', width: '0em'}))
        ], {params: {posX: '30', posY: '30'}})
    ]),
];


// position: 'fixed', top: '{{posY}px', left: '{{posX}}px'
